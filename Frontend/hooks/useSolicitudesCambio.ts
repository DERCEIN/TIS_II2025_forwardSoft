import { useState, useEffect } from 'react'
import { ApiService } from '@/lib/api'

export interface SolicitudCambio {
  id: number
  evaluacion_id: number
  tipo_evaluacion: 'clasificacion' | 'final'
  evaluador_id?: number
  evaluador_nombre?: string
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

export interface LogCambio {
  id: number
  tabla_afectada: string
  registro_id: number
  operacion: 'INSERT' | 'UPDATE' | 'DELETE'
  valores_anteriores: any
  valores_nuevos: any
  inscripcion_area_id: number
  olimpista_id: number
  participante_nombre: string
  area_competencia: string
  nivel_competencia: string
  evaluador_id: number
  evaluador_nombre: string
  evaluador_email: string
  coordinador_area_id: number
  coordinador_nombre: string
  motivo_cambio: string
  observaciones: string
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado'
  ip_origen: string
  fecha_cambio: string
}

export interface EstadisticasAprobaciones {
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

export interface EstadisticasLog {
  total_cambios: number
  cambios_por_mes: Array<{
    mes: string
    cantidad: number
  }>
  cambios_por_evaluador: Array<{
    evaluador_nombre: string
    cantidad: number
    porcentaje: number
  }>
  cambios_por_tipo: Array<{
    tipo: string
    cantidad: number
  }>
  cambios_recientes: LogCambio[]
}

export interface Evaluacion {
  id: number
  participante_nombre: string
  area_competencia: string
  nivel_competencia: string
  puntuacion: number
  observaciones?: string
  fecha_evaluacion: string
  tipo: 'clasificacion' | 'final'
}

export const useSolicitudesCambio = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSolicitudes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiService.get('/evaluador/solicitudes-cambio')
      setSolicitudes(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const crearSolicitud = async (data: {
    evaluacion_id: number
    valor_nuevo: number
    motivo_cambio: string
    observaciones?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiService.post('/evaluador/solicitudes-cambio', data)
      
      // Actualizar lista local
      setSolicitudes(prev => [response.data, ...prev])
      
      return response.data
    } catch (err: any) {
      setError(err.message || 'Error al crear solicitud')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cancelarSolicitud = async (solicitudId: number) => {
    try {
      setLoading(true)
      setError(null)
      await ApiService.delete(`/evaluador/solicitudes-cambio/${solicitudId}`)
      
      // Actualizar lista local
      setSolicitudes(prev => prev.filter(s => s.id !== solicitudId))
    } catch (err: any) {
      setError(err.message || 'Error al cancelar solicitud')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    solicitudes,
    loading,
    error,
    fetchSolicitudes,
    crearSolicitud,
    cancelarSolicitud
  }
}

export const useAprobaciones = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasAprobaciones | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSolicitudesPendientes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiService.get('/coordinador/solicitudes-pendientes')
      setSolicitudes(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      setError(null)
      const response = await ApiService.get('/coordinador/estadisticas-aprobaciones')
      setEstadisticas(response.data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas')
    }
  }

  const procesarSolicitud = async (solicitudId: number, data: {
    accion: 'aprobar' | 'rechazar' | 'solicitar_info'
    observaciones?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiService.post(`/coordinador/solicitudes-cambio/${solicitudId}/procesar`, data)
      
      // Actualizar lista local
      setSolicitudes(prev => prev.map(s => 
        s.id === solicitudId 
          ? { 
              ...s, 
              estado: data.accion === 'aprobar' ? 'aprobado' : 'rechazado',
              observaciones_coordinador: data.observaciones,
              fecha_revision: new Date().toISOString()
            }
          : s
      ))
      
      return response.data
    } catch (err: any) {
      setError(err.message || 'Error al procesar solicitud')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    solicitudes,
    estadisticas,
    loading,
    error,
    fetchSolicitudesPendientes,
    fetchEstadisticas,
    procesarSolicitud
  }
}

export const useLogAuditoria = () => {
  const [logs, setLogs] = useState<LogCambio[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasLog | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async (filters?: {
    search?: string
    fecha_desde?: string
    fecha_hasta?: string
    evaluador_id?: string
    estado?: string
    operacion?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
      if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
      if (filters?.evaluador_id) params.append('evaluador_id', filters.evaluador_id)
      if (filters?.estado) params.append('estado', filters.estado)
      if (filters?.operacion) params.append('operacion', filters.operacion)

      const response = await ApiService.get(`/coordinador/log-auditoria?${params}`)
      setLogs(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar logs')
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      setError(null)
      const response = await ApiService.get('/coordinador/estadisticas-log')
      setEstadisticas(response.data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas')
    }
  }

  return {
    logs,
    estadisticas,
    loading,
    error,
    fetchLogs,
    fetchEstadisticas
  }
}

export const useEvaluaciones = () => {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvaluaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiService.get('/evaluador/evaluaciones')
      setEvaluaciones(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluaciones')
    } finally {
      setLoading(false)
    }
  }

  return {
    evaluaciones,
    loading,
    error,
    fetchEvaluaciones
  }
}

export const useNotificacionesCambios = () => {
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotificaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiService.get('/notificaciones')
      setNotificaciones(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (notificacionId: number) => {
    try {
      setError(null)
      await ApiService.put(`/notificaciones/${notificacionId}/leer`)
      
      // Actualizar lista local
      setNotificaciones(prev => prev.map(n => 
        n.id === notificacionId ? { ...n, leida: true } : n
      ))
    } catch (err: any) {
      setError(err.message || 'Error al marcar notificación como leída')
      throw err
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      setError(null)
      await ApiService.put('/notificaciones/marcar-todas-leidas')
      
      // Actualizar lista local
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
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
