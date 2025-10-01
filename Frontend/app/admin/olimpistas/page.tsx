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
  Edit,
  Trash2,
  Plus,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  School,
  FileText
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
  nivel_competencia: string
  departamento: string
  fecha_registro: string
  estado: string
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
    
    const matchesArea = !filterArea || olimpista.area_competencia === filterArea
    
    return matchesSearch && matchesArea
  })

  // Obtener áreas únicas
  const areas = [...new Set(olimpistas.map(o => o.area_competencia))]

  // Función para mostrar detalles del olimpista
  const handleViewDetails = (olimpista: Olimpista) => {
    setSelectedOlimpista(olimpista)
    setShowDetailsModal(true)
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
                        <Badge variant="outline">
                          {olimpista.area_competencia}
                        </Badge>
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
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Detalles del Olimpista
              </DialogTitle>
              <DialogDescription>
                Información completa del participante
              </DialogDescription>
            </DialogHeader>
            
            {selectedOlimpista && (
              <div className="space-y-6">
                {/* Información personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                        <p className="font-semibold">{selectedOlimpista.nombre} {selectedOlimpista.apellido}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{selectedOlimpista.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                        <p>{selectedOlimpista.telefono}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Documento de Identidad</p>
                        <p>{selectedOlimpista.documento_identidad}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                        <p>{new Date(selectedOlimpista.fecha_nacimiento).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Unidad Educativa</p>
                        <p>{selectedOlimpista.unidad_educativa}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                        <p>{selectedOlimpista.departamento}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                        <p>{new Date(selectedOlimpista.fecha_registro).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Información académica */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Información Académica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Área de Competencia</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedOlimpista.area_competencia}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nivel de Competencia</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedOlimpista.nivel_competencia}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Estado */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado del Participante</p>
                      <Badge className={getEstadoColor(selectedOlimpista.estado)}>
                        {selectedOlimpista.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
