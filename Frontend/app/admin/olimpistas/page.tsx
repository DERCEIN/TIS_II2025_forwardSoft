"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Users, 
  Eye,
  Plus,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  School,
  FileText,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { OlimpistaService } from '@/lib/api'

interface Olimpista {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  documento_identidad: string
  fecha_nacimiento: string
  unidad_educativa: string
  area_competencia: string
  areas_competencia: string
  nivel_competencia: string
  niveles_competencia: string
  departamento: string
  fecha_registro: string
  estado: string
  grado_escolaridad?: string
  // Campos de grupo
  es_grupo?: boolean
  nombre_grupo?: string
  integrantes_grupo?: string
  nombres_grupos?: string
  integrantes_grupos?: string
  inscripciones_detalle?: Array<{
    area_nombre: string
    nivel_nombre: string
    es_grupo: boolean
    nombre_grupo?: string
    integrantes_grupo?: string
  }>
  // Campos de tutor legal
  tutor_legal_nombre?: string
  tutor_legal_telefono?: string
  tutor_legal_email?: string
  tutor_legal_direccion?: string
  // Campos de tutor académico
  tutor_academico_nombre?: string
  tutor_academico_telefono?: string
  tutor_academico_email?: string
  tutor_academico_especialidad?: string
}

export default function OlimpistasPage() {
  const router = useRouter()
  const [olimpistas, setOlimpistas] = useState<Olimpista[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [selectedOlimpista, setSelectedOlimpista] = useState<Olimpista | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Cargar olimpistas
  useEffect(() => {
    const loadOlimpistas = async () => {
      try {
        setLoading(true)
        const response = await OlimpistaService.getAll()
        if (response.success && response.data) {
          setOlimpistas(response.data)
        } else {
          setError('Error al cargar olimpistas')
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar olimpistas')
      } finally {
        setLoading(false)
      }
    }

    loadOlimpistas()
  }, [])

  // Filtrar olimpistas
  const filteredOlimpistas = olimpistas.filter(olimpista => {
    const matchesSearch = 
      olimpista.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      olimpista.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      olimpista.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      olimpista.documento_identidad.includes(searchTerm)
    
    const matchesArea = !filterArea || 
      olimpista.area_competencia === filterArea ||
      (olimpista.areas_competencia && olimpista.areas_competencia.includes(filterArea))
    
    return matchesSearch && matchesArea
  })

  
  const areas = [...new Set(
    olimpistas.flatMap(o => 
      o.areas_competencia ? o.areas_competencia.split(', ') : [o.area_competencia]
    ).filter(Boolean)
  )]

 
  const handleViewDetails = async (olimpista: Olimpista) => {
    try {
      setLoading(true)
      const response = await OlimpistaService.getById(olimpista.id)
      if (response.success && response.data) {
        setSelectedOlimpista(response.data)
        setShowDetailsModal(true)
      } else {
        console.error('Error al obtener detalles:', response.message)
        setSelectedOlimpista(olimpista) // Fallback a datos básicos
    setShowDetailsModal(true)
      }
    } catch (error) {
      console.error('Error al obtener detalles del olimpista:', error)
      setSelectedOlimpista(olimpista) // Fallback a datos básicos
      setShowDetailsModal(true)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800'
      case 'inactivo':
        return 'bg-red-100 text-red-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando olimpistas...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Olimpistas Registrados</h1>
              <p className="text-muted-foreground">Gestiona los participantes de la olimpiada</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push('/admin/importar')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Olimpista
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Olimpistas</p>
                  <p className="text-2xl font-bold">{olimpistas.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {olimpistas.filter(o => o.estado === 'activo').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Áreas</p>
                  <p className="text-2xl font-bold text-purple-600">{areas.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departamentos</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {[...new Set(olimpistas.map(o => o.departamento))].length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, apellido, email o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="">Todas las áreas</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de olimpistas */}
        <Card>
          <CardHeader>
            <CardTitle>
              Olimpistas ({filteredOlimpistas.length} de {olimpistas.length})
            </CardTitle>
            <CardDescription>
              Lista de participantes registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </div>
            ) : filteredOlimpistas.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterArea ? 'No se encontraron olimpistas con los filtros aplicados' : 'No hay olimpistas registrados'}
                </p>
                {!searchTerm && !filterArea && (
                  <Button onClick={() => router.push('/admin/importar')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Olimpistas
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOlimpistas.map((olimpista) => (
                  <div key={olimpista.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {olimpista.nombre} {olimpista.apellido}
                        </h3>
                        <Badge className={getEstadoColor(olimpista.estado)}>
                          {olimpista.estado}
                        </Badge>
                        {olimpista.areas_competencia ? (
                          <div className="flex flex-wrap gap-1">
                            {olimpista.areas_competencia.split(', ').map((area, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {area.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                        <Badge variant="outline">
                            {olimpista.area_competencia || 'Sin área'}
                        </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Email:</span> {olimpista.email}
                        </div>
                        <div>
                          <span className="font-medium">Teléfono:</span> {olimpista.telefono}
                        </div>
                        <div>
                          <span className="font-medium">Documento:</span> {olimpista.documento_identidad}
                        </div>
                        <div>
                          <span className="font-medium">Unidad Educativa:</span> {olimpista.unidad_educativa}
                        </div>
                        <div>
                          <span className="font-medium">Departamento:</span> {olimpista.departamento}
                        </div>
                        <div>
                          <span className="font-medium">Registrado:</span> {new Date(olimpista.fecha_registro).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(olimpista)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalles del olimpista */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Detalles del Participante
              </DialogTitle>
            </DialogHeader>
            
            {selectedOlimpista && (
              <div className="space-y-8">
                {/* Header del participante */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {selectedOlimpista.nombre.charAt(0)}{selectedOlimpista.apellido.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900">{selectedOlimpista.nombre} {selectedOlimpista.apellido}</h3>
                      <p className="text-gray-600 mt-1 text-lg">Participante de las Olimpiadas</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant={selectedOlimpista.estado === 'activo' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                          {selectedOlimpista.estado}
                        </Badge>
                        {selectedOlimpista.es_grupo && (
                          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200 px-3 py-1">
                            <Users className="w-4 h-4 mr-1" />
                            Participación Grupal
                          </Badge>
                        )}
                      </div>
                    </div>
                      </div>
                    </div>
                    
                {/* Información personal */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                    <User className="h-6 w-6 text-blue-600" />
                    Información Personal
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wide mb-1">Email</p>
                        <p className="font-semibold text-gray-900 text-xs truncate" title={selectedOlimpista.email}>{selectedOlimpista.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-green-600 uppercase tracking-wide mb-1">Teléfono</p>
                        <p className="font-semibold text-gray-900 text-xs truncate" title={selectedOlimpista.telefono}>{selectedOlimpista.telefono}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-3 w-3 text-white" />
                  </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-red-600 uppercase tracking-wide mb-1">Departamento</p>
                        <p className="font-semibold text-gray-900 text-xs truncate" title={selectedOlimpista.departamento}>{selectedOlimpista.departamento}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wide mb-1">Documento</p>
                        <p className="font-semibold text-gray-900 text-xs truncate" title={selectedOlimpista.documento_identidad}>{selectedOlimpista.documento_identidad}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-orange-600 uppercase tracking-wide mb-1">Fecha de Nacimiento</p>
                        <p className="font-semibold text-gray-900 text-xs truncate" title={new Date(selectedOlimpista.fecha_nacimiento).toLocaleDateString()}>{new Date(selectedOlimpista.fecha_nacimiento).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <School className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wide mb-1">Unidad Educativa</p>
                        <p className="font-semibold text-gray-900 text-xs truncate" title={selectedOlimpista.unidad_educativa}>{selectedOlimpista.unidad_educativa}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del Tutor Legal */}
                {(selectedOlimpista.tutor_legal_nombre || selectedOlimpista.tutor_legal_telefono || selectedOlimpista.tutor_legal_email) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      Tutor Legal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedOlimpista.tutor_legal_nombre && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-600 uppercase tracking-wide mb-1">Nombre Completo</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_legal_nombre}</p>
                        </div>
                      )}
                      {selectedOlimpista.tutor_legal_telefono && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-600 uppercase tracking-wide mb-1">Teléfono</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_legal_telefono}</p>
                        </div>
                      )}
                      {selectedOlimpista.tutor_legal_email && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-600 uppercase tracking-wide mb-1">Email</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_legal_email}</p>
                        </div>
                      )}
                      {selectedOlimpista.tutor_legal_direccion && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-600 uppercase tracking-wide mb-1">Dirección</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_legal_direccion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Información del Tutor Académico */}
                {(selectedOlimpista.tutor_academico_nombre || selectedOlimpista.tutor_academico_telefono || selectedOlimpista.tutor_academico_email) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                      <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      Tutor Académico
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedOlimpista.tutor_academico_nombre && (
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                          <p className="text-sm font-medium text-teal-600 uppercase tracking-wide mb-1">Nombre Completo</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_academico_nombre}</p>
                        </div>
                      )}
                      {selectedOlimpista.tutor_academico_telefono && (
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                          <p className="text-sm font-medium text-teal-600 uppercase tracking-wide mb-1">Teléfono</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_academico_telefono}</p>
                        </div>
                      )}
                      {selectedOlimpista.tutor_academico_email && (
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                          <p className="text-sm font-medium text-teal-600 uppercase tracking-wide mb-1">Email</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_academico_email}</p>
                        </div>
                      )}
                      {selectedOlimpista.tutor_academico_especialidad && (
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                          <p className="text-sm font-medium text-teal-600 uppercase tracking-wide mb-1">Especialidad</p>
                          <p className="font-semibold text-gray-900">{selectedOlimpista.tutor_academico_especialidad}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Información académica */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                    <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                      <School className="h-5 w-5 text-white" />
                    </div>
                    Información Académica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                      <p className="text-sm font-medium text-violet-600 uppercase tracking-wide mb-2">Área de Competencia</p>
                      <Badge variant="outline" className="text-sm px-3 py-1 bg-violet-100 text-violet-700 border-violet-300">
                        {selectedOlimpista.area_competencia}
                      </Badge>
                    </div>
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                      <p className="text-sm font-medium text-violet-600 uppercase tracking-wide mb-2">Nivel de Competencia</p>
                      <Badge variant="outline" className="text-sm px-3 py-1 bg-violet-100 text-violet-700 border-violet-300">
                        {selectedOlimpista.nivel_competencia}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Información de grupos */}
                {(selectedOlimpista.es_grupo || selectedOlimpista.nombre_grupo || selectedOlimpista.nombres_grupos) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      Información de Grupo
                    </h4>
                    <div className="space-y-4">
                      {(selectedOlimpista.nombre_grupo || selectedOlimpista.nombres_grupos) && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-2">Nombre del Grupo</p>
                          <p className="font-bold text-green-800 text-lg">
                            {selectedOlimpista.nombre_grupo || selectedOlimpista.nombres_grupos || 'N/A'}
                          </p>
                        </div>
                      )}
                      
                      {(selectedOlimpista.integrantes_grupo || selectedOlimpista.integrantes_grupos) && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-2">Integrantes del Grupo</p>
                          <div className="mt-2 p-4 bg-white rounded-lg border border-green-200">
                            <pre className="text-sm whitespace-pre-wrap text-gray-700">
                              {selectedOlimpista.integrantes_grupo || selectedOlimpista.integrantes_grupos || 'N/A'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detalles de inscripciones por área */}
                {selectedOlimpista.inscripciones_detalle && selectedOlimpista.inscripciones_detalle.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Inscripciones Detalladas
                    </h4>
                    <div className="space-y-4">
                      {selectedOlimpista.inscripciones_detalle.map((inscripcion, index) => (
                        <div key={index} className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-sm px-3 py-1 bg-cyan-100 text-cyan-700 border-cyan-300">
                              {inscripcion.area_nombre}
                            </Badge>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                              {inscripcion.nivel_nombre}
                            </Badge>
                            {selectedOlimpista.grado_escolaridad && (
                              <Badge variant="secondary" className="text-sm px-3 py-1 ml-2">
                                {selectedOlimpista.grado_escolaridad}
                              </Badge>
                            )}
                    </div>
                          {inscripcion.es_grupo && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-cyan-200">
                              <p className="text-sm font-medium text-cyan-600 mb-1">Grupo: {inscripcion.nombre_grupo}</p>
                              {inscripcion.integrantes_grupo && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                  <pre className="whitespace-pre-wrap text-gray-600">{inscripcion.integrantes_grupo}</pre>
                                </div>
                              )}
                            </div>
                          )}
                  </div>
                      ))}
                </div>
                  </div>
                )}

              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
