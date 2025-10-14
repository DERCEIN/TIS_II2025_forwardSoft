"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/NotificationProvider'
import { 
  Plus, 
  Edit, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Search,
  Filter,
  Download
} from 'lucide-react'

interface SolicitudCambio {
  id: number
  evaluacion_id: number
  tipo_evaluacion: 'clasificacion' | 'final'
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

interface Evaluacion {
  id: number
  participante_nombre: string
  area_competencia: string
  nivel_competencia: string
  puntuacion: number
  observaciones?: string
  fecha_evaluacion: string
  tipo: 'clasificacion' | 'final'
}

export default function SolicitudesCambioPage() {
  const { user } = useAuth()
  const { success, error, warning } = useNotifications()
  
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([])
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  
  // Estados para modal de nueva solicitud
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<Evaluacion | null>(null)
  const [nuevaPuntuacion, setNuevaPuntuacion] = useState('')
  const [motivoCambio, setMotivoCambio] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSolicitudes()
    fetchEvaluaciones()
  }, [])

  const fetchSolicitudes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluador/solicitudes-cambio', {
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

  const fetchEvaluaciones = async () => {
    try {
      const response = await fetch('/api/evaluador/evaluaciones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvaluaciones(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching evaluaciones:', err)
    }
  }

  const handleNuevaSolicitud = () => {
    if (!selectedEvaluacion) {
      warning('Selección requerida', 'Debes seleccionar una evaluación')
      return
    }
    
    if (!nuevaPuntuacion || !motivoCambio) {
      warning('Campos requeridos', 'Debes completar todos los campos obligatorios')
      return
    }

    const puntuacion = parseFloat(nuevaPuntuacion)
    if (puntuacion < 0 || puntuacion > 100) {
      warning('Puntuación inválida', 'La puntuación debe estar entre 0 y 100')
      return
    }

    if (puntuacion === selectedEvaluacion.puntuacion) {
      warning('Sin cambios', 'La nueva puntuación debe ser diferente a la actual')
      return
    }

    setSubmitting(true)
    
    // Simular envío de solicitud
    setTimeout(() => {
      const nuevaSolicitud: SolicitudCambio = {
        id: Date.now(),
        evaluacion_id: selectedEvaluacion.id,
        tipo_evaluacion: selectedEvaluacion.tipo,
        participante_nombre: selectedEvaluacion.participante_nombre,
        area_competencia: selectedEvaluacion.area_competencia,
        nivel_competencia: selectedEvaluacion.nivel_competencia,
        valor_anterior: selectedEvaluacion.puntuacion,
        valor_nuevo: puntuacion,
        motivo_cambio: motivoCambio,
        observaciones_evaluador: observaciones,
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString()
      }

      setSolicitudes(prev => [nuevaSolicitud, ...prev])
      success('Solicitud enviada', 'Tu solicitud de cambio ha sido enviada para revisión')
      
      // Reset form
      setSelectedEvaluacion(null)
      setNuevaPuntuacion('')
      setMotivoCambio('')
      setObservaciones('')
      setIsModalOpen(false)
      setSubmitting(false)
    }, 1000)
  }

  const handleCancelarSolicitud = async (solicitudId: number) => {
    try {
      const response = await fetch(`/api/evaluador/solicitudes-cambio/${solicitudId}/cancelar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSolicitudes(prev => prev.filter(s => s.id !== solicitudId))
        success('Solicitud cancelada', 'La solicitud ha sido cancelada exitosamente')
      }
    } catch (err) {
      error('Error', 'No se pudo cancelar la solicitud')
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

  const filteredSolicitudes = solicitudes.filter(solicitud => {
    const matchesSearch = solicitud.participante_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solicitud.area_competencia.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterEstado === 'todos' || solicitud.estado === filterEstado
    return matchesSearch && matchesFilter
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Solicitudes de Cambio</h1>
          <p className="text-muted-foreground">Gestiona las solicitudes de modificación de notas</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Cambio</DialogTitle>
              <DialogDescription>
                Solicita un cambio en la puntuación de una evaluación
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="evaluacion">Evaluación a modificar</Label>
                <Select onValueChange={(value) => {
                  const evaluacion = evaluaciones.find(e => e.id.toString() === value)
                  setSelectedEvaluacion(evaluacion || null)
                  if (evaluacion) {
                    setNuevaPuntuacion(evaluacion.puntuacion.toString())
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una evaluación" />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluaciones.map((evaluacion) => (
                      <SelectItem key={evaluacion.id} value={evaluacion.id.toString()}>
                        {evaluacion.participante_nombre} - {evaluacion.area_competencia} ({evaluacion.puntuacion} pts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvaluacion && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="puntuacion-actual">Puntuación Actual</Label>
                    <Input 
                      id="puntuacion-actual" 
                      value={selectedEvaluacion.puntuacion} 
                      disabled 
                    />
                  </div>
                  <div>
                    <Label htmlFor="nueva-puntuacion">Nueva Puntuación *</Label>
                    <Input 
                      id="nueva-puntuacion" 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.01"
                      value={nuevaPuntuacion}
                      onChange={(e) => setNuevaPuntuacion(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="motivo">Motivo del Cambio *</Label>
                <Textarea 
                  id="motivo" 
                  placeholder="Explica detalladamente por qué necesitas cambiar esta puntuación..."
                  value={motivoCambio}
                  onChange={(e) => setMotivoCambio(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones Adicionales</Label>
                <Textarea 
                  id="observaciones" 
                  placeholder="Información adicional que pueda ser útil..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleNuevaSolicitud} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Solicitudes de Cambio</CardTitle>
              <CardDescription>
                Historial de solicitudes de modificación de notas
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por participante o área..."
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
                {searchTerm || filterEstado !== 'todos' 
                  ? 'No se encontraron solicitudes con los filtros aplicados'
                  : 'Aún no has realizado ninguna solicitud de cambio'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSolicitudes.map((solicitud) => (
                <Card key={solicitud.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <h3 className="font-semibold text-foreground">
                            {solicitud.participante_nombre}
                          </h3>
                          {getEstadoBadge(solicitud.estado)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Área:</span>
                            <p className="font-medium">{solicitud.area_competencia}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nivel:</span>
                            <p className="font-medium">{solicitud.nivel_competencia}</p>
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
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelarSolicitud(solicitud.id)}
                          >
                            Cancelar
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
    </div>
  )
}
