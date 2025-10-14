"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/NotificationProvider'
import { 
  Bell, 
  BellRing, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  FileText,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  Edit,
  Info,
  Filter,
  RefreshCw
} from 'lucide-react'

interface Notificacion {
  id: number
  tipo: 'cambio_nota' | 'aprobacion' | 'rechazo' | 'solicitud_info' | 'solicitud_pendiente'
  titulo: string
  mensaje: string
  datos_adicionales: any
  leida: boolean
  fecha_notificacion: string
  fecha_lectura?: string
  // Campos específicos para solicitudes de aprobación
  solicitud_id?: number
  evaluador_nombre?: string
  participante_nombre?: string
  valor_anterior?: number
  valor_nuevo?: number
  motivo_cambio?: string
  // Campos adicionales para el sistema de aprobaciones
  evaluacion_id?: number
  area_competencia?: string
  nivel_competencia?: string
  fecha_solicitud?: string
  estado_solicitud?: 'pendiente' | 'aprobada' | 'rechazada'
  observaciones_coordinador?: string
}

interface NotificacionesPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificacionesPanel: React.FC<NotificacionesPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { success, error } = useNotifications()
  
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterLeidas, setFilterLeidas] = useState<string>('todas')
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    no_leidas: 0,
    solicitudes_pendientes: 0,
    aprobaciones_recientes: 0,
    rechazos_recientes: 0
  })
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotificaciones()
      fetchEstadisticas()
      
      // Auto-refresh cada 30 segundos si está habilitado
      if (autoRefresh) {
        const interval = setInterval(() => {
          fetchNotificaciones(true) // true indica refresh silencioso
          fetchEstadisticas(true)
        }, 30000)
        
        return () => clearInterval(interval)
      }
    }
  }, [isOpen, autoRefresh])

  const fetchNotificaciones = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      
      const response = await fetch('/api/notificaciones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotificaciones(data.data || [])
      }
    } catch (err) {
      if (!silent) error('Error', 'No se pudieron cargar las notificaciones')
    } finally {
      if (!silent) setLoading(false)
      else setRefreshing(false)
    }
  }

  const fetchEstadisticas = async (silent = false) => {
    try {
      const response = await fetch('/api/notificaciones/estadisticas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data.data || estadisticas)
      }
    } catch (err) {
      if (!silent) console.error('Error al cargar estadísticas:', err)
    }
  }

  const marcarComoLeida = async (notificacionId: number) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificacionId}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotificaciones(prev => prev.map(n => 
          n.id === notificacionId ? { ...n, leida: true, fecha_lectura: new Date().toISOString() } : n
        ))
      }
    } catch (err) {
      error('Error', 'No se pudo marcar la notificación como leída')
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true, fecha_lectura: new Date().toISOString() })))
        success('Notificaciones', 'Todas las notificaciones han sido marcadas como leídas')
      }
    } catch (err) {
      error('Error', 'No se pudieron marcar todas las notificaciones como leídas')
    }
  }

  const handleAprobarSolicitud = async (notificacionId: number, solicitudId: number) => {
    if (!confirm('¿Estás seguro de que quieres aprobar esta solicitud de cambio?')) {
      return
    }

    try {
      const response = await fetch(`/api/coordinador/solicitudes-cambio/${solicitudId}/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accion: 'aprobar',
          observaciones: 'Aprobado desde notificaciones'
        })
      })

      if (response.ok) {
        // Marcar notificación como leída y actualizar estado
        setNotificaciones(prev => prev.map(n => 
          n.id === notificacionId 
            ? { ...n, leida: true, fecha_lectura: new Date().toISOString(), tipo: 'aprobacion' }
            : n
        ))
        success('✅ Aprobado', 'Solicitud aprobada exitosamente')
      }
    } catch (err) {
      error('Error', 'No se pudo aprobar la solicitud')
    }
  }

  const handleRechazarSolicitud = async (notificacionId: number, solicitudId: number) => {
    if (!confirm('¿Estás seguro de que quieres rechazar esta solicitud de cambio?')) {
      return
    }

    try {
      const response = await fetch(`/api/coordinador/solicitudes-cambio/${solicitudId}/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accion: 'rechazar',
          observaciones: 'Rechazado desde notificaciones'
        })
      })

      if (response.ok) {
        // Marcar notificación como leída y actualizar estado
        setNotificaciones(prev => prev.map(n => 
          n.id === notificacionId 
            ? { ...n, leida: true, fecha_lectura: new Date().toISOString(), tipo: 'rechazo' }
            : n
        ))
        success('❌ Rechazado', 'Solicitud rechazada')
      }
    } catch (err) {
      error('Error', 'No se pudo rechazar la solicitud')
    }
  }

  const eliminarNotificacion = async (notificacionId: number) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificacionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotificaciones(prev => prev.filter(n => n.id !== notificacionId))
        success('Eliminado', 'Notificación eliminada')
        fetchEstadisticas(true)
      }
    } catch (err) {
      error('Error', 'No se pudo eliminar la notificación')
    }
  }

  const aprobarTodasLasSolicitudes = async () => {
    if (!confirm('¿Estás seguro de que quieres aprobar TODAS las solicitudes pendientes?')) {
      return
    }

    try {
      const solicitudesPendientes = notificaciones.filter(n => n.tipo === 'solicitud_pendiente' && n.solicitud_id)
      
      for (const notif of solicitudesPendientes) {
        if (notif.solicitud_id) {
          await handleAprobarSolicitud(notif.id, notif.solicitud_id)
        }
      }
      
      success('✅ Aprobación Masiva', `${solicitudesPendientes.length} solicitudes aprobadas`)
      fetchNotificaciones(true)
      fetchEstadisticas(true)
    } catch (err) {
      error('Error', 'No se pudieron aprobar todas las solicitudes')
    }
  }

  const rechazarTodasLasSolicitudes = async () => {
    if (!confirm('¿Estás seguro de que quieres rechazar TODAS las solicitudes pendientes?')) {
      return
    }

    try {
      const solicitudesPendientes = notificaciones.filter(n => n.tipo === 'solicitud_pendiente' && n.solicitud_id)
      
      for (const notif of solicitudesPendientes) {
        if (notif.solicitud_id) {
          await handleRechazarSolicitud(notif.id, notif.solicitud_id)
        }
      }
      
      success('❌ Rechazo Masivo', `${solicitudesPendientes.length} solicitudes rechazadas`)
      fetchNotificaciones(true)
      fetchEstadisticas(true)
    } catch (err) {
      error('Error', 'No se pudieron rechazar todas las solicitudes')
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'cambio_nota':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'aprobacion':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rechazo':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'solicitud_info':
        return <MessageSquare className="h-4 w-4 text-orange-600" />
      case 'solicitud_pendiente':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'cambio_nota':
        return <Badge variant="outline" className="text-blue-600">Cambio de Nota</Badge>
      case 'aprobacion':
        return <Badge variant="outline" className="text-green-600">Aprobación</Badge>
      case 'rechazo':
        return <Badge variant="outline" className="text-red-600">Rechazo</Badge>
      case 'solicitud_info':
        return <Badge variant="outline" className="text-orange-600">Solicitud Info</Badge>
      case 'solicitud_pendiente':
        return <Badge variant="destructive" className="text-yellow-600">Pendiente Aprobación</Badge>
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  const filteredNotificaciones = notificaciones.filter(notif => {
    const matchesTipo = filterTipo === 'todos' || notif.tipo === filterTipo
    const matchesLeidas = filterLeidas === 'todas' || 
                         (filterLeidas === 'no_leidas' && !notif.leida) ||
                         (filterLeidas === 'leidas' && notif.leida)
    return matchesTipo && matchesLeidas
  })

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                Notificaciones
                {notificacionesNoLeidas > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {notificacionesNoLeidas}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Mantente informado sobre cambios y actualizaciones
              </DialogDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
                title="Ver estadísticas"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Estadísticas
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchNotificaciones()}
                disabled={refreshing}
                title="Actualizar notificaciones"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={marcarTodasComoLeidas}
                disabled={notificacionesNoLeidas === 0}
                title="Marcar todas como leídas"
              >
                <Eye className="h-4 w-4 mr-1" />
                Marcar todas como leídas
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estadísticas */}
          {mostrarEstadisticas && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
                    <div className="text-xs text-blue-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{estadisticas.no_leidas}</div>
                    <div className="text-xs text-orange-600">No Leídas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{estadisticas.solicitudes_pendientes}</div>
                    <div className="text-xs text-yellow-600">Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{estadisticas.aprobaciones_recientes}</div>
                    <div className="text-xs text-green-600">Aprobadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{estadisticas.rechazos_recientes}</div>
                    <div className="text-xs text-red-600">Rechazadas</div>
                  </div>
                </div>
                
                {/* Acciones Masivas */}
                {estadisticas.solicitudes_pendientes > 0 && (
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button 
                      size="sm" 
                      onClick={aprobarTodasLasSolicitudes}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobar Todas ({estadisticas.solicitudes_pendientes})
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={rechazarTodasLasSolicitudes}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar Todas ({estadisticas.solicitudes_pendientes})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filtros y Controles */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-2">
              <select 
                value={filterTipo} 
                onChange={(e) => setFilterTipo(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="cambio_nota">Cambios de Nota</option>
                <option value="aprobacion">Aprobaciones</option>
                <option value="rechazo">Rechazos</option>
                <option value="solicitud_info">Solicitudes de Info</option>
                <option value="solicitud_pendiente">Pendientes de Aprobación</option>
              </select>
              
              <select 
                value={filterLeidas} 
                onChange={(e) => setFilterLeidas(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="todas">Todas</option>
                <option value="no_leidas">No leídas</option>
                <option value="leidas">Leídas</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input 
                  type="checkbox" 
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              
              <div className="text-xs text-muted-foreground">
                {filteredNotificaciones.length} de {notificaciones.length}
              </div>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Cargando notificaciones...</p>
              </div>
            ) : filteredNotificaciones.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No hay notificaciones</h3>
                <p className="text-muted-foreground">
                  {filterTipo !== 'todos' || filterLeidas !== 'todas'
                    ? 'No se encontraron notificaciones con los filtros aplicados'
                    : 'No tienes notificaciones pendientes'
                  }
                </p>
                {filterTipo === 'solicitud_pendiente' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">¡Excelente! No hay solicitudes pendientes de aprobación</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotificaciones.map((notif) => (
                  <Card 
                    key={notif.id} 
                    className={`border-l-4 ${
                      notif.leida 
                        ? 'border-l-muted-foreground bg-muted/30' 
                        : 'border-l-primary bg-background'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {getTipoIcon(notif.tipo)}
                            <h3 className={`font-semibold ${notif.leida ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {notif.titulo}
                            </h3>
                            {getTipoBadge(notif.tipo)}
                            {!notif.leida && (
                              <Badge variant="secondary" className="text-xs">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                          
                          <p className={`text-sm ${notif.leida ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notif.mensaje}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(notif.fecha_notificacion).toLocaleString()}
                            </span>
                            {notif.fecha_lectura && (
                              <span>
                                Leída: {new Date(notif.fecha_lectura).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Botones de acción para solicitudes pendientes */}
                          {notif.tipo === 'solicitud_pendiente' && notif.solicitud_id && (
                            <div className="mt-3 flex gap-2">
                              <Button 
                                size="sm"
                                onClick={() => handleAprobarSolicitud(notif.id, notif.solicitud_id!)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprobar
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRechazarSolicitud(notif.id, notif.solicitud_id!)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}

                          {/* Información específica para solicitudes pendientes */}
                          {notif.tipo === 'solicitud_pendiente' && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <User className="h-4 w-4 text-yellow-600 mt-0.5" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="font-medium text-yellow-800">Evaluador:</span>
                                      <p className="text-yellow-700">{notif.evaluador_nombre}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-yellow-800">Participante:</span>
                                      <p className="text-yellow-700">{notif.participante_nombre}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium text-yellow-800">Cambio:</span>
                                      <span className="px-2 py-1 bg-yellow-100 rounded text-yellow-800 font-mono">
                                        {notif.valor_anterior} → {notif.valor_nuevo}
                                      </span>
                                      <span className={`font-medium ${
                                        (notif.valor_nuevo || 0) > (notif.valor_anterior || 0) 
                                          ? 'text-green-600' 
                                          : 'text-red-600'
                                      }`}>
                                        ({(notif.valor_nuevo || 0) - (notif.valor_anterior || 0) > 0 ? '+' : ''}
                                        {(notif.valor_nuevo || 0) - (notif.valor_anterior || 0)})
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="font-medium text-yellow-800 text-xs">Motivo:</span>
                                    <p className="text-yellow-700 text-xs mt-1 italic">"{notif.motivo_cambio}"</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 ml-4">
                          {!notif.leida && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => marcarComoLeida(notif.id)}
                              title="Marcar como leída"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => eliminarNotificacion(notif.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente de notificación en tiempo real
export const NotificacionTiempoReal: React.FC = () => {
  const { success, error, warning, info } = useNotifications()
  const [notificacionesSocket, setNotificacionesSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    // Conectar al WebSocket para notificaciones en tiempo real
    const token = localStorage.getItem('token')
    if (token) {
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/notificaciones?token=${token}`)
      
      ws.onopen = () => {
        console.log('Conectado a notificaciones en tiempo real')
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.tipo) {
          case 'cambio_nota':
            info('Nueva Solicitud', data.mensaje)
            break
          case 'aprobacion':
            success('Solicitud Aprobada', data.mensaje)
            break
          case 'rechazo':
            warning('Solicitud Rechazada', data.mensaje)
            break
          case 'solicitud_info':
            info('Solicitud de Información', data.mensaje)
            break
          default:
            info('Notificación', data.mensaje)
        }
      }
      
      ws.onerror = (error) => {
        console.error('Error en WebSocket:', error)
      }
      
      ws.onclose = () => {
        console.log('Desconectado de notificaciones en tiempo real')
      }
      
      setNotificacionesSocket(ws)
    }

    return () => {
      if (notificacionesSocket) {
        notificacionesSocket.close()
      }
    }
  }, [])

  return null
}

// Hook para usar notificaciones
export const useNotificacionesCambios = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotificaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/notificaciones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotificaciones(data.data || [])
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (notificacionId: number) => {
    try {
      setError(null)
      const response = await fetch(`/api/notificaciones/${notificacionId}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotificaciones(prev => prev.map(n => 
          n.id === notificacionId ? { ...n, leida: true, fecha_lectura: new Date().toISOString() } : n
        ))
      }
    } catch (err: any) {
      setError(err.message || 'Error al marcar notificación como leída')
      throw err
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      setError(null)
      const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true, fecha_lectura: new Date().toISOString() })))
      }
    } catch (err: any) {
      setError(err.message || 'Error al marcar todas las notificaciones como leídas')
      throw err
    }
  }

  return {
    notificaciones,
    loading,
    error,
    fetchNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas
  }
}
