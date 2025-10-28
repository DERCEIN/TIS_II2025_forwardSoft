"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useNotifications } from '@/components/NotificationProvider'
import { 
  Search,
  Save,
  Edit,
  CheckCircle,
  Clock,
  User,
  BookOpen,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { EvaluacionService, AuthService, EvaluadorService, ConfiguracionService, DescalificacionService } from '@/lib/api'

interface Participante {
  id: number
  nombre: string
  documento: string
  unidad_educativa: string
  area: string
  nivel: string
  nota_actual?: number
  estado: 'pendiente' | 'evaluado' | 'revisado' | 'descalificado'
  fecha_evaluacion?: string
}

export default function RegistroNotas() {
  const { success, error } = useNotifications()
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterArea, setFilterArea] = useState('todos')
  const [filterNivel, setFilterNivel] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [editingParticipant, setEditingParticipant] = useState<number | null>(null)
  const [notaTemporal, setNotaTemporal] = useState('')
  const [observacionesTemporal, setObservacionesTemporal] = useState('')
  const [motivoModificacion, setMotivoModificacion] = useState('')
  const [fase, setFase] = useState<'clasificacion' | 'premiacion'>('clasificacion')
  const [allowedAreas, setAllowedAreas] = useState<string[]>([])
  const [loadingAreas, setLoadingAreas] = useState<boolean>(true)
  const [confirmandoCierre, setConfirmandoCierre] = useState(false)
  const [myAreaId, setMyAreaId] = useState<number | null>(null)
  const [myNivelId, setMyNivelId] = useState<number | null>(null)
  const [tienePermisos, setTienePermisos] = useState<boolean>(false)
  const [permisoInfo, setPermisoInfo] = useState<any>(null)
  const [loadingPermisos, setLoadingPermisos] = useState<boolean>(true)
  const [puntuacionMinima, setPuntuacionMinima] = useState<number>(51) // Valor por defecto
  const [puntuacionMaxima, setPuntuacionMaxima] = useState<number>(100)
  const [reglasDescalificacion, setReglasDescalificacion] = useState<any[]>([])
  const [participanteDescalificando, setParticipanteDescalificando] = useState<number | null>(null)
  const [reglaSeleccionada, setReglaSeleccionada] = useState<number | null>(null)
  const [motivoDescalificacion, setMotivoDescalificacion] = useState('')

  
  const fetchParticipantes = async () => {
    try {
      setLoading(true)
      const res = await EvaluadorService.getEvaluaciones()
      const data = (res && (res as any).data) ? (res as any).data : []
      
      console.log('=== DATOS DEL BACKEND ===')
      console.log('Response completa:', res)
      console.log('Data extraída:', data)
      console.log('Tipo de data:', typeof data)
      console.log('Es array:', Array.isArray(data))
      console.log('Longitud:', data.length)
      if (data.length > 0) {
        console.log('Primer elemento:', data[0])
        console.log('Estados encontrados:', [...new Set(data.map((d: any) => d.estado))])
      }
      console.log('========================')

      
      const mapped: Participante[] = (Array.isArray(data) ? data : []).map((row: any) => ({
        id: Number(row.inscripcion_area_id || row.id || row.olimpista_id || row.participante_id),
        nombre: row.competidor || row.olimpista_nombre || row.nombre || `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim(),
        documento: row.documento || row.olimpista_documento || row.documento_identidad || row.doc || '-',
        unidad_educativa: row.institucion || row.unidad_educativa_nombre || row.institucion_nombre || '-',
        area: row.area || row.area_nombre || '-',
        nivel: row.nivel || row.nivel_nombre || '-',
        nota_actual: typeof row.nota_actual === 'number' ? row.nota_actual : (typeof row.puntaje === 'number' ? row.puntaje : (typeof row.puntuacion === 'number' ? row.puntuacion : (typeof row.nota === 'number' ? row.nota : (typeof row.puntuacion_final === 'number' ? row.puntuacion_final : undefined)))),
        estado: (row.estado || row.inscripcion_estado || 'pendiente') as any,
        fecha_evaluacion: row.fecha_asignacion || row.fecha_evaluacion || row.updated_at || row.created_at || undefined,
      }))

      console.log('Total participantes mapeados:', mapped.length)
      console.log('Participantes:', mapped)
      console.log('Participantes descalificados:', mapped.filter(p => p.estado === 'descalificado'))
      setParticipantes(mapped)
      
      
      if (mapped.length > 0) {
        const primerParticipante = data[0]
        console.log('=== DEBUG DETECCIÓN DE IDs ===')
        console.log('Datos completos del primer participante:', primerParticipante)
        console.log('Claves disponibles:', Object.keys(primerParticipante))
        console.log('Valores específicos:')
        console.log('- area_competencia_id:', primerParticipante.area_competencia_id)
        console.log('- nivel_competencia_id:', primerParticipante.nivel_competencia_id)
        console.log('- area_id:', primerParticipante.area_id)
        console.log('- nivel_id:', primerParticipante.nivel_id)
        console.log('================================')
        
       
        const areaId = primerParticipante.area_competencia_id || 
                      primerParticipante.area_id || 
                      primerParticipante.areaId ||
                      primerParticipante.areaCompetenciaId
        if (areaId) {
          setMyAreaId(Number(areaId))
          console.log('✅ Area ID detectado:', areaId)
        } else {
          console.log('❌ No se encontró area_id')
        }
        
        
        const nivelId = primerParticipante.nivel_competencia_id || 
                       primerParticipante.nivel_id || 
                       primerParticipante.nivelId ||
                       primerParticipante.nivelCompetenciaId
        if (nivelId) {
          setMyNivelId(Number(nivelId))
          console.log('✅ Nivel ID detectado:', nivelId)
        } else {
          console.log('❌ No se encontró nivel_id')
        }
        
        
        if (!areaId || !nivelId) {
          try {
            const profile = await AuthService.getProfile()
            console.log('Perfil del evaluador:', profile)
            
            if (profile && profile.data) {
              if (!areaId && profile.data.area_id) {
                setMyAreaId(Number(profile.data.area_id))
                console.log('Area ID del perfil:', profile.data.area_id)
              }
              if (!nivelId && profile.data.nivel_id) {
                setMyNivelId(Number(profile.data.nivel_id))
                console.log('Nivel ID del perfil:', profile.data.nivel_id)
              }
            }
          } catch (e) {
            console.error('Error obteniendo perfil:', e)
          }
        }
      }
    } catch (e) {
      console.error('Error cargando evaluaciones:', e)
      error('Error', 'No se pudieron cargar las evaluaciones')
      setParticipantes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipantes()
    verificarPermisosEvaluador()
  }, [])

  
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoadingAreas(true)
        const me = await AuthService.getProfile()
        const areas = (me as any)?.data?.areas
        
        console.log('Areas del perfil:', areas)
        
        if (Array.isArray(areas) && areas.length > 0) {
          
          const areaNames = areas.map((a: any) => a.area_nombre || a.nombre || String(a))
          console.log('Nombres de áreas permitidas:', areaNames)
          setAllowedAreas(areaNames)
          
          if (filterArea !== 'todos' && !areaNames.includes(filterArea)) {
            setFilterArea('todos')
          }
        } else {
          // Si no hay áreas específicas, permitir todas
          setAllowedAreas([])
        }
      } catch {
        setAllowedAreas([])
      } finally {
        setLoadingAreas(false)
      }
    }
    loadAreas()

    
    const loadConfiguracion = async () => {
      try {
        const config = await ConfiguracionService.getConfiguracion()
        if (config.success && config.data) {
          const data = config.data
          if (data.clasificacion_puntuacion_minima !== undefined) {
            setPuntuacionMinima(parseFloat(data.clasificacion_puntuacion_minima))
          }
          if (data.clasificacion_puntuacion_maxima !== undefined) {
            setPuntuacionMaxima(parseFloat(data.clasificacion_puntuacion_maxima))
          }
        }
      } catch (error) {
        console.error('Error cargando configuración:', error)
      }
    }
    loadConfiguracion()

    
    const loadReglasDescalificacion = async () => {
      try {
        if (myAreaId) {
          const reglas = await DescalificacionService.getReglasPorArea(myAreaId)
          if (reglas.success && reglas.data) {
            setReglasDescalificacion(reglas.data)
            console.log('Reglas de desclasificación cargadas:', reglas.data)
          }
        }
      } catch (error) {
        console.error('Error cargando reglas de descalificación:', error)
      }
    }
    loadReglasDescalificacion()
  }, [])

  
  useEffect(() => {
    const loadReglasPorArea = async () => {
      try {
        if (myAreaId) {
          const reglas = await DescalificacionService.getReglasPorArea(myAreaId)
          if (reglas.success && reglas.data) {
            setReglasDescalificacion(reglas.data)
            console.log(`Reglas cargadas para área ID ${myAreaId}:`, reglas.data)
          }
        }
      } catch (error) {
        console.error('Error cargando reglas por área:', error)
      }
    }
    loadReglasPorArea()
  }, [myAreaId])

  const participantesFiltrados = participantes.filter(participante => {
    console.log('Filtrando participante:', participante.nombre, 'Area:', participante.area, 'Allowed areas:', allowedAreas)
    
    if (allowedAreas.length > 0 && !allowedAreas.includes(participante.area)) {
      console.log('Participante filtrado por allowedAreas:', participante.nombre)
      return false
    }
    const matchesSearch = participante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        participante.documento.includes(searchTerm) ||
                        participante.unidad_educativa.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesArea = filterArea === 'todos' || participante.area === filterArea
    const matchesNivel = filterNivel === 'todos' || participante.nivel === filterNivel
    const matchesEstado = filterEstado === 'todos' || participante.estado === filterEstado

    return matchesSearch && matchesArea && matchesNivel && matchesEstado
  })

  const handleEditNota = (participante: Participante) => {
    setEditingParticipant(participante.id)
    setNotaTemporal(participante.nota_actual?.toString() || '')
    setObservacionesTemporal('')
    setMotivoModificacion('')
  }

  const handleDescalificar = (participante: Participante) => {
    setParticipanteDescalificando(participante.id)
    setReglaSeleccionada(null)
    setMotivoDescalificacion('')
  }

  const handleCancelarDescalificacion = () => {
    setParticipanteDescalificando(null)
    setReglaSeleccionada(null)
    setMotivoDescalificacion('')
  }

  const handleConfirmarDescalificacion = async (participanteId: number) => {
    if (!reglaSeleccionada || !motivoDescalificacion.trim()) {
      error('Error', 'Debe seleccionar una regla y escribir el motivo')
      return
    }

    try {
      const response = await DescalificacionService.registrarDescalificacion({
        inscripcion_area_id: participanteId,
        regla_descalificacion_id: reglaSeleccionada,
        motivo: motivoDescalificacion.trim()
      })

      if (response.success) {
        success('Descalificación registrada', 'El participante ha sido descalificado exitosamente')
        fetchParticipantes() // Recargar la lista
        handleCancelarDescalificacion()
      } else {
        error('Error', response.message || 'Error al registrar la descalificación')
      }
    } catch (err) {
      error('Error', 'Error al registrar la descalificación')
    }
  }

  const verificarPermisosEvaluador = async () => {
    try {
      setLoadingPermisos(true)
      const response = await EvaluadorService.verificarPermisos()
      
      if (response.success && response.data) {
        setTienePermisos(response.data.tiene_permiso)
        setPermisoInfo(response.data.permiso)
        
        if (!response.data.tiene_permiso) {
          error('Sin permisos', 'No tiene permisos activos para registrar notas. Contacte al coordinador.')
        }
      } else {
        setTienePermisos(false)
        error('Error', 'No se pudieron verificar los permisos')
      }
    } catch (err: any) {
      console.error('Error verificando permisos:', err)
      setTienePermisos(false)
      error('Error', 'Error al verificar permisos')
    } finally {
      setLoadingPermisos(false)
    }
  }

  const handleSaveNota = async (participanteId: number) => {
   
    if (!tienePermisos) {
      error('Sin permisos', 'No tiene permisos activos para registrar notas. Contacte al coordinador.')
      return
    }
    
    const participante = participantes.find(p => p.id === participanteId)
    if (participante && allowedAreas.length > 0 && !allowedAreas.includes(participante.area)) {
      error('Sin permiso', 'Solo puede registrar notas de su área asignada')
      return
    }
    const nota = parseFloat(notaTemporal)
    
    if (isNaN(nota) || nota < 0 || nota > 100) {
      error('Error', 'La nota debe estar entre 0 y 100')
      return
    }

    
    if (fase === 'clasificacion' && nota < puntuacionMinima) {
      const confirmar = window.confirm(
        `La nota ${nota} es menor a ${puntuacionMinima} puntos. Los participantes necesitan al menos ${puntuacionMinima} puntos para clasificar a la siguiente etapa. ¿Desea continuar?`
      )
      if (!confirmar) {
        return
      }
    }

    
    if (myAreaId && nota < puntuacionMinima) {
      try {
        const verificacion = await DescalificacionService.verificarDescalificacionAutomatica(myAreaId, nota)
        if (verificacion.success && verificacion.data.debe_descalificar) {
          const confirmarDescalificacion = window.confirm(
            `La puntuación ${nota} es menor al mínimo requerido (${puntuacionMinima} puntos). ¿Desea descalificar automáticamente al participante por esta razón?`
          )
          if (confirmarDescalificacion) {
           
            const reglaPuntuacion = reglasDescalificacion.find(r => r.tipo === 'puntuacion')
            if (reglaPuntuacion) {
              setReglaSeleccionada(reglaPuntuacion.id)
              setMotivoDescalificacion(`Puntuación ${nota} menor al mínimo requerido de ${puntuacionMinima} puntos`)
              await handleConfirmarDescalificacion(participanteId)
              return 
            }
          }
        }
      } catch (error) {
        console.error('Error verificando descalificación automática:', error)
      }
    }

    
    const esModificacion = participante?.nota_actual !== undefined && participante?.nota_actual !== null
    if (esModificacion && !motivoModificacion.trim()) {
      error('Error', 'Debe especificar el motivo de la modificación')
      return
    }

    setSaving(true)
    
    try {
      
      if (fase === 'clasificacion') {
        const data: any = {
          inscripcion_area_id: participanteId,
          puntuacion: nota,
          is_final: false,
        }
        if (observacionesTemporal && observacionesTemporal.trim()) {
          data.observaciones = observacionesTemporal.trim()
        }
        if (esModificacion && motivoModificacion.trim()) {
          data.motivo_modificacion = motivoModificacion.trim()
        }
        await EvaluacionService.evaluarClasificacion(data)
      } else {
        const data: any = {
          inscripcion_area_id: participanteId,
          puntuacion: nota,
        }
        if (observacionesTemporal && observacionesTemporal.trim()) {
          data.observaciones = observacionesTemporal.trim()
        }
        if (esModificacion && motivoModificacion.trim()) {
          data.motivo_modificacion = motivoModificacion.trim()
        }
        await EvaluacionService.evaluarFinal(data)
      }
      
      setParticipantes(prev => prev.map(p => 
        p.id === participanteId 
          ? { 
              ...p, 
              nota_actual: nota, 
              estado: 'evaluado' as const,
              fecha_evaluacion: new Date().toISOString().split('T')[0]
            }
          : p
      ))
      
      setEditingParticipant(null)
      setNotaTemporal('')
      setObservacionesTemporal('')
      
      success('Éxito', 'Nota registrada con éxito')
    } catch (err: any) {
      console.error('Error guardando nota:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'No se pudo guardar la nota'
      error('Error', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingParticipant(null)
    setNotaTemporal('')
    setObservacionesTemporal('')
    setMotivoModificacion('')
  }

  const handleConfirmarCierreCalificacion = async () => {
    if (participantes.filter(p => p.estado === 'evaluado').length !== participantes.length) {
      error('Error', 'Debe completar todas las evaluaciones antes de confirmar el cierre')
      return
    }

    if (participantes.length === 0) {
      error('Error', 'No hay participantes asignados')
      return
    }

    
    const areaId = myAreaId || 1
    const nivelId = myNivelId || 1
    
    if (!myAreaId || !myNivelId) {
      const confirmar = window.confirm(
        'No se pudieron detectar automáticamente el área y nivel. ¿Desea continuar con valores por defecto (Área: 1, Nivel: 1)?'
      )
      if (!confirmar) return
    }

    setConfirmandoCierre(true)
    
    try {
      const response = await EvaluacionService.confirmarCierreCalificacion({
        area_id: areaId,
        nivel_id: nivelId,
        fase: fase
      })

      if (response.success) {
        success('Éxito', 'Cierre de calificación confirmado exitosamente. Las listas de clasificación han sido generadas.')
        
        await fetchParticipantes()
      } else {
        error('Error', response.message || 'No se pudo confirmar el cierre de calificación')
      }
    } catch (err: any) {
      console.error('Error confirmando cierre de calificación:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'No se pudo confirmar el cierre de calificación'
      error('Error', errorMessage)
    } finally {
      setConfirmandoCierre(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>
      case 'evaluado':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Evaluado</Badge>
      case 'revisado':
        return <Badge variant="outline" className="flex items-center gap-1"><Edit className="h-3 w-3" />Revisado</Badge>
      case 'descalificado':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Descalificado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const areasUnicas = [...new Set(participantes.map(p => p.area))].filter(a => allowedAreas.length === 0 || allowedAreas.includes(a))
  const nivelesUnicos = [...new Set(participantes.map(p => p.nivel))]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Registro de Notas</h1>
          <p className="text-sm text-gray-600">
            Gestiona las evaluaciones de los participantes asignados
          </p>
          
          {/* Estado de Permisos */}
          {loadingPermisos ? (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">Verificando permisos...</span>
              </div>
            </div>
          ) : tienePermisos ? (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Permisos activos</span>
              </div>
              {permisoInfo && (
                <div className="mt-2 text-xs text-green-600">
                  <p>Período: {new Date(permisoInfo.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(permisoInfo.fecha_fin).toLocaleDateString('es-ES')}</p>
                  <p>Coordinador: {permisoInfo.coordinador} | Área: {permisoInfo.area}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Sin permisos activos</span>
              </div>
              <p className="mt-1 text-xs text-red-600">
                No puede registrar notas en este momento. Contacte al coordinador para obtener permisos.
              </p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Nombre, documento o institución..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Fase</Label>
                <Select value={fase} onValueChange={(v) => setFase(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clasificacion">Clasificación</SelectItem>
                    <SelectItem value="premiacion">Premiación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Área</Label>
                <Select value={filterArea} onValueChange={setFilterArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las áreas</SelectItem>
                    {areasUnicas.map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Nivel</Label>
                <Select value={filterNivel} onValueChange={setFilterNivel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los niveles</SelectItem>
                    {nivelesUnicos.map(nivel => (
                      <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado</Label>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="evaluado">Evaluado</SelectItem>
                    <SelectItem value="revisado">Revisado</SelectItem>
                    <SelectItem value="descalificado">Descalificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Participantes */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Participantes Asignados
            </CardTitle>
            <CardDescription className="text-sm">
              {participantesFiltrados.length} participantes encontrados
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Cargando participantes...</span>
              </div>
            ) : participantesFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay participantes</h3>
                <p className="text-gray-600">No se encontraron participantes con los filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participante</TableHead>
                      <TableHead>Institución</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantesFiltrados.map((participante) => (
                      <React.Fragment key={participante.id}>
                        <TableRow className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{participante.nombre}</p>
                                <p className="text-xs text-gray-500">{participante.documento}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{participante.unidad_educativa}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {participante.area}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {participante.nivel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {editingParticipant === participante.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={notaTemporal}
                                  onChange={(e) => setNotaTemporal(e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  placeholder="0-100"
                                />
                                <Input
                                  value={observacionesTemporal}
                                  onChange={(e) => setObservacionesTemporal(e.target.value)}
                                  placeholder="Observaciones (opcional)"
                                  className="h-8 text-xs w-40"
                                />
                                {participante.nota_actual !== undefined && participante.nota_actual !== null && (
                                  <Input
                                    value={motivoModificacion}
                                    onChange={(e) => setMotivoModificacion(e.target.value)}
                                    placeholder="Motivo de modificación *"
                                    className="h-8 text-xs w-48 border-orange-300"
                                  />
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNota(participante.id)}
                                  disabled={saving}
                                  className="h-8 px-2"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${
                                  participante.nota_actual ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                  {typeof participante.nota_actual === 'number' ? participante.nota_actual.toFixed(2) : 'Sin nota'}
                                </span>
                                {participante.nota_actual && (
                                  <span className="text-xs text-gray-500">/100</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getEstadoBadge(participante.estado)}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500">
                              {participante.fecha_evaluacion || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {editingParticipant !== participante.id && participanteDescalificando !== participante.id && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditNota(participante)}
                                  disabled={!tienePermisos}
                                  className="h-8 w-8 p-0"
                                  title={!tienePermisos ? "Sin permisos activos" : "Editar nota"}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {participante.estado !== 'descalificado' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDescalificar(participante)}
                                    disabled={!tienePermisos}
                                    className="h-8 w-8 p-0"
                                    title={!tienePermisos ? "Sin permisos activos" : "Desclasificar participante"}
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                            {participanteDescalificando === participante.id && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelarDescalificacion}
                                  className="h-8 px-2 text-xs"
                                >
                                  ✕ Cancelar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {/* Sección de Descalificación Expandible */}
                        {participanteDescalificando === participante.id && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0">
                              <div className="bg-red-50 border-t border-red-200 p-4">
                                <div className="max-w-4xl mx-auto">
                                  <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <h4 className="text-lg font-semibold text-red-900">Desclasificar Participante</h4>
                                  </div>
                                  
                                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="text-sm font-medium text-blue-900">
                                        Área: {participante.area} • {reglasDescalificacion.length} reglas disponibles
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Información del participante */}
                                    <div className="bg-white rounded-lg p-4 border border-red-200">
                                      <h5 className="font-medium text-gray-900 mb-3">Información del Participante</h5>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="text-gray-600">Nombre:</span>
                                          <p className="font-medium">{participante.nombre}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Documento:</span>
                                          <p className="font-medium">{participante.documento}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Institución:</span>
                                          <p className="font-medium">{participante.unidad_educativa}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Área:</span>
                                          <p className="font-medium">{participante.area}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Formulario de descalificación */}
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                          Regla de Desclasificación *
                                        </label>
                                        {reglasDescalificacion.length === 0 ? (
                                          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                                            No hay reglas de desclasificación configuradas para esta área
                                          </div>
                                        ) : (
                                          <>
                                            <select
                                              value={reglaSeleccionada || ''}
                                              onChange={(e) => setReglaSeleccionada(parseInt(e.target.value))}
                                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                              required
                                            >
                                              <option value="">Seleccionar regla...</option>
                                              {reglasDescalificacion
                                                .sort((a, b) => {
                                                  const tipoOrder = { 'fraude': 1, 'comportamiento': 2, 'tecnico': 3, 'puntuacion': 4 }
                                                  return (tipoOrder[a.tipo as keyof typeof tipoOrder] || 5) - (tipoOrder[b.tipo as keyof typeof tipoOrder] || 5)
                                                })
                                                .map((regla) => (
                                                  <option key={regla.id} value={regla.id}>
                                                    {regla.nombre_regla} ({regla.tipo})
                                                  </option>
                                                ))}
                                            </select>
                                            <div className="mt-2 text-xs text-gray-600">
                                              {reglasDescalificacion.filter(r => r.tipo === 'fraude').length} fraude • 
                                              {reglasDescalificacion.filter(r => r.tipo === 'comportamiento').length} comportamiento • 
                                              {reglasDescalificacion.filter(r => r.tipo === 'tecnico').length} técnico • 
                                              {reglasDescalificacion.filter(r => r.tipo === 'puntuacion').length} puntuación
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                          Motivo de Desclasificación *
                                        </label>
                                        <textarea
                                          value={motivoDescalificacion}
                                          onChange={(e) => setMotivoDescalificacion(e.target.value)}
                                          placeholder="Describe específicamente qué regla se incumplió..."
                                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                          rows={3}
                                          required
                                        />
                                      </div>

                                      {reglaSeleccionada && (
                                        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                                          <p className="text-sm font-semibold text-red-900 mb-1">
                                            Descripción de la regla:
                                          </p>
                                          <p className="text-sm text-red-800">
                                            {reglasDescalificacion.find(r => r.id === reglaSeleccionada)?.descripcion}
                                          </p>
                                        </div>
                                      )}

                                      <div className="flex gap-3">
                                        <Button
                                          variant="outline"
                                          onClick={handleCancelarDescalificacion}
                                          className="flex-1"
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleConfirmarDescalificacion(participante.id)}
                                          disabled={!reglaSeleccionada || !motivoDescalificacion.trim()}
                                          className="flex-1"
                                        >
                                          <AlertCircle className="h-4 w-4 mr-2" />
                                          Confirmar Desclasificación
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Asignados</p>
                  <p className="text-2xl font-bold text-gray-900">{participantes.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {participantes.filter(p => p.estado === 'pendiente').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Evaluados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {participantes.filter(p => p.estado === 'evaluado').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {participantes.filter(p => p.nota_actual).length > 0 
                      ? (participantes.filter(p => p.nota_actual).reduce((sum, p) => sum + (p.nota_actual || 0), 0) / participantes.filter(p => p.nota_actual).length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Botón de Confirmar Cierre de Calificación */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Cierre de Calificación</CardTitle>
            <CardDescription>
              Una vez completadas todas las evaluaciones, confirma el cierre para generar las listas de clasificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Evaluaciones completadas: {participantes.filter(p => p.estado === 'evaluado').length} / {participantes.length}</p>
                {participantes.filter(p => p.estado === 'evaluado').length === participantes.length && participantes.length > 0 && (
                  <p className="text-green-600 font-medium">✓ Todas las evaluaciones están completas</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Área ID: {myAreaId || 'No detectado'} | Nivel ID: {myNivelId || 'No detectado'}
                </p>
              </div>
              <Button 
                onClick={handleConfirmarCierreCalificacion}
                disabled={participantes.filter(p => p.estado === 'evaluado').length !== participantes.length || participantes.length === 0 || confirmandoCierre || !tienePermisos}
                className="bg-purple-600 hover:bg-purple-700"
                title={!tienePermisos ? "Sin permisos activos" : ""}
              >
                {confirmandoCierre ? 'Confirmando...' : 'Confirmar Cierre de Calificación'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

