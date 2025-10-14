"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  FileText
} from 'lucide-react'

interface EstadisticasNotificaciones {
  total: number
  no_leidas: number
  solicitudes_pendientes: number
  aprobaciones_recientes: number
  rechazos_recientes: number
}

interface NotificacionesResumenProps {
  onAbrirNotificaciones: () => void
}

export const NotificacionesResumen: React.FC<NotificacionesResumenProps> = ({ onAbrirNotificaciones }) => {
  const { user } = useAuth()
  const [estadisticas, setEstadisticas] = useState<EstadisticasNotificaciones>({
    total: 0,
    no_leidas: 0,
    solicitudes_pendientes: 0,
    aprobaciones_recientes: 0,
    rechazos_recientes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEstadisticas()
    
    // Auto-refresh cada 60 segundos
    const interval = setInterval(fetchEstadisticas, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchEstadisticas = async () => {
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
      console.error('Error al cargar estadísticas de notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onAbrirNotificaciones}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones
          {estadisticas.no_leidas > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {estadisticas.no_leidas}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          Sistema de aprobaciones y notificaciones
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {/* Solicitudes Pendientes - Prioridad Alta */}
          {estadisticas.solicitudes_pendientes > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {estadisticas.solicitudes_pendientes} solicitud{estadisticas.solicitudes_pendientes !== 1 ? 'es' : ''} pendiente{estadisticas.solicitudes_pendientes !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Requieren tu aprobación inmediata
              </p>
            </div>
          )}

          {/* Estadísticas Generales */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{estadisticas.total}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-muted-foreground">No leídas:</span>
              <span className="font-medium">{estadisticas.no_leidas}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Aprobadas:</span>
              <span className="font-medium">{estadisticas.aprobaciones_recientes}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">Rechazadas:</span>
              <span className="font-medium">{estadisticas.rechazos_recientes}</span>
            </div>
          </div>

          {/* Acción Principal */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={(e) => {
              e.stopPropagation()
              onAbrirNotificaciones()
            }}
          >
            <Bell className="h-4 w-4 mr-2" />
            Ver Todas las Notificaciones
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para mostrar notificaciones en tiempo real en el header (versión completa)
export const NotificacionesHeader: React.FC<{ onAbrirNotificaciones: () => void }> = ({ onAbrirNotificaciones }) => {
  const [contador, setContador] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContador()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchContador, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchContador = async () => {
    try {
      const response = await fetch('/api/notificaciones/contador', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setContador(data.data?.no_leidas || 0)
      }
    } catch (err) {
      console.error('Error al cargar contador de notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onAbrirNotificaciones}
      className="relative hidden lg:flex"
    >
      <Bell className="h-4 w-4 mr-2" />
      <span className="hidden lg:inline">Notificaciones</span>
      {contador > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {contador > 99 ? '99+' : contador}
        </Badge>
      )}
    </Button>
  )
}

// Componente para mostrar notificaciones en tiempo real en el header (versión móvil - solo icono)
export const NotificacionesHeaderMobile: React.FC<{ onAbrirNotificaciones: () => void }> = ({ onAbrirNotificaciones }) => {
  const [contador, setContador] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContador()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchContador, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchContador = async () => {
    try {
      const response = await fetch('/api/notificaciones/contador', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setContador(data.data?.no_leidas || 0)
      }
    } catch (err) {
      console.error('Error al cargar contador de notificaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onAbrirNotificaciones}
      className="relative"
    >
      <Bell className="h-4 w-4" />
      {contador > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {contador > 99 ? '99+' : contador}
        </Badge>
      )}
    </Button>
  )
}
