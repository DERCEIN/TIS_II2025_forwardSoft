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
import { EvaluacionService, AuthService, EvaluadorService } from '@/lib/api'

interface Participante {
  id: number
  nombre: string
  documento: string
  unidad_educativa: string
  area: string
  nivel: string
  nota_actual?: number
  estado: 'pendiente' | 'evaluado' | 'revisado'
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

  
  const fetchParticipantes = async () => {
    try {
      setLoading(true)
      const res = await EvaluadorService.getEvaluaciones()
      const data = (res && (res as any).data) ? (res as any).data : []

      
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

      setParticipantes(mapped)
      
      // Extraer area_id y nivel_id del primer participante para usar en cierre de calificación
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
  }, [])

  
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoadingAreas(true)
        const me = await AuthService.getProfile()
        const areas = (me as any)?.data?.areas
        if (Array.isArray(areas) && areas.length > 0) {
          setAllowedAreas(areas.map((a: any) => String(a)))
          
          if (filterArea !== 'todos' && !areas.includes(filterArea)) {
            setFilterArea('todos')
          }
        } else {
          setAllowedAreas([])
        }
      } catch {
        setAllowedAreas([])
      } finally {
        setLoadingAreas(false)
      }
    }
    loadAreas()
  }, [])

  const participantesFiltrados = participantes.filter(participante => {
    
    if (allowedAreas.length > 0 && !allowedAreas.includes(participante.area)) {
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

  const handleSaveNota = async (participanteId: number) => {
    
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

    // Usar valores por defecto si no se detectaron los IDs
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
                      <TableRow key={participante.id} className="hover:bg-gray-50">
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
                          {editingParticipant !== participante.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditNota(participante)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
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
                disabled={participantes.filter(p => p.estado === 'evaluado').length !== participantes.length || participantes.length === 0 || confirmandoCierre}
                className="bg-purple-600 hover:bg-purple-700"
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



