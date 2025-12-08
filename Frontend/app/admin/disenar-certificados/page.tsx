"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Save, Eye, RotateCcw, Upload, X } from "lucide-react"
import { CertificadosService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import CertificatePreviewModal from "./components/CertificatePreviewModal"

export default function DisenarCertificadosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [originalConfig, setOriginalConfig] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/admin/dashboard')
      return
    }
    cargarConfiguracion()
  }, [user])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      const response = await CertificadosService.getConfiguracion()
      if (response.success) {
        setConfig(response.data)
        setOriginalConfig(JSON.parse(JSON.stringify(response.data))) 
        setIsSaved(true)
        
        if (response.data.logo_url) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'
          let logoPath = response.data.logo_url
          if (logoPath.startsWith('/uploads/certificados/logos/')) {
           
            const filename = logoPath.split('/').pop()
            logoPath = `${apiUrl}/api/certificados/logo/${filename}`
          } else if (logoPath.startsWith('/')) {
            logoPath = `${apiUrl}${logoPath}`
          }
          setLogoPreview(logoPath)
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await CertificadosService.guardarConfiguracion(config)
      if (response.success) {
        setOriginalConfig(JSON.parse(JSON.stringify(config))) // Deep copy
        setIsSaved(true)
        toast({
          title: "Éxito",
          description: "Configuración guardada correctamente",
        })
      }
    } catch (error) {
      console.error('Error guardando configuración:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('¿Estás seguro de restaurar los valores por defecto?')) {
      setConfig({
        fondo_color: '#FDFDFF',
        borde_color: '#173A78',
        borde_secundario_color: '#C8D2EB',
        texto_principal_color: '#2F3F76',
        texto_secundario_color: '#282828',
        titulo_fuente: 'times',
        titulo_estilo: 'bold',
        titulo_tamano: 36,
        nombre_fuente: 'times',
        nombre_estilo: 'bold',
        nombre_tamano: 54,
        cuerpo_fuente: 'times',
        cuerpo_estilo: 'normal',
        cuerpo_tamano: 14,
        logo_url: '/sansi-logo.png',
        logo_tamano: 130,
        logo_posicion_x: 45,
        logo_posicion_y: 'center',
        texto_honor: 'Por haber obtenido {puesto} {medalla} en el área de {area}, durante la gestión {gestion}.',
        texto_participacion: 'Por su valiosa participación en el área de {area} durante la gestión {gestion}, demostrando compromiso con la ciencia y la tecnología.',
        texto_firma_izquierda: 'Coordinador de Área',
        texto_firma_derecha: 'Director / Autoridad',
        texto_pie_pagina: 'SanSi · Olimpiada de Ciencia y Tecnología · Certificado Oficial',
        margen: 15,
        radio_borde: 6,
      })
    }
  }

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => {
      const newConfig = { ...prev, [key]: value }
      
      const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(originalConfig)
      setIsSaved(!hasChanges)
      return newConfig
    })
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

  
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Formato no permitido. Use PNG, JPG o WEBP",
        variant: "destructive"
      })
      return
    }

    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo excede 5MB",
        variant: "destructive"
      })
      return
    }

    try {
      setUploadingLogo(true)

     
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

     
      const response = await CertificadosService.subirLogo(file)
      if (response.success) {
       
        const logoUrl = response.data.logo_url
        updateConfig('logo_url', logoUrl)
        
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'
        let fullLogoUrl = logoUrl
        if (logoUrl.startsWith('/uploads/certificados/logos/')) {
         
          const filename = logoUrl.split('/').pop()
          fullLogoUrl = `${apiUrl}/api/certificados/logo/${filename}`
        } else if (logoUrl.startsWith('/')) {
          fullLogoUrl = `${apiUrl}${logoUrl}`
        }
        setLogoPreview(fullLogoUrl)
        
        toast({
          title: "Éxito",
          description: "Logo subido correctamente",
        })
      }
    } catch (error: any) {
      console.error('Error subiendo logo:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el logo",
        variant: "destructive"
      })
      setLogoPreview(null)
    } finally {
      setUploadingLogo(false)
      
      event.target.value = ''
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    updateConfig('logo_url', '/sansi-logo.png') 
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Diseñar Certificados</h1>
        <p className="text-gray-600">
          Personaliza el diseño de los certificados que se generarán para los participantes
        </p>
      </div>

      <div className="flex gap-4 mb-6 items-center">
        <Button onClick={handleSave} disabled={saving || isSaved} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : isSaved ? '✓ Guardado' : 'Guardar Configuración'}
        </Button>
        {!isSaved && (
          <span className="text-sm text-amber-600 font-medium">
            ⚠ Tienes cambios sin guardar
          </span>
        )}
        <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Restaurar Valores por Defecto
        </Button>
        <Button 
          onClick={() => setShowPreview(true)} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={!config}
        >
          <Eye className="w-4 h-4" />
          Ver Vista Previa
        </Button>
      </div>

      <Tabs defaultValue="colores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colores">Colores</TabsTrigger>
          <TabsTrigger value="fuentes">Fuentes</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="textos">Textos</TabsTrigger>
          <TabsTrigger value="espaciado">Espaciado</TabsTrigger>
        </TabsList>

        {/* Tab Colores */}
        <TabsContent value="colores">
          <Card>
            <CardHeader>
              <CardTitle>Colores del Certificado</CardTitle>
              <CardDescription>Personaliza los colores del fondo, bordes y textos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fondo_color">Color de Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fondo_color"
                      type="color"
                      value={config.fondo_color}
                      onChange={(e) => updateConfig('fondo_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.fondo_color}
                      onChange={(e) => updateConfig('fondo_color', e.target.value)}
                      placeholder="#FDFDFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borde_color">Color de Borde Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="borde_color"
                      type="color"
                      value={config.borde_color}
                      onChange={(e) => updateConfig('borde_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.borde_color}
                      onChange={(e) => updateConfig('borde_color', e.target.value)}
                      placeholder="#173A78"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borde_secundario_color">Color de Borde Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="borde_secundario_color"
                      type="color"
                      value={config.borde_secundario_color}
                      onChange={(e) => updateConfig('borde_secundario_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.borde_secundario_color}
                      onChange={(e) => updateConfig('borde_secundario_color', e.target.value)}
                      placeholder="#C8D2EB"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="texto_principal_color">Color de Texto Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="texto_principal_color"
                      type="color"
                      value={config.texto_principal_color}
                      onChange={(e) => updateConfig('texto_principal_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.texto_principal_color}
                      onChange={(e) => updateConfig('texto_principal_color', e.target.value)}
                      placeholder="#2F3F76"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="texto_secundario_color">Color de Texto Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="texto_secundario_color"
                      type="color"
                      value={config.texto_secundario_color}
                      onChange={(e) => updateConfig('texto_secundario_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.texto_secundario_color}
                      onChange={(e) => updateConfig('texto_secundario_color', e.target.value)}
                      placeholder="#282828"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Fuentes */}
        <TabsContent value="fuentes">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Fuentes</CardTitle>
              <CardDescription>Personaliza las fuentes, estilos y tamaños de los textos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Título */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Título "CERTIFICADO"</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo_fuente">Fuente</Label>
                    <select
                      id="titulo_fuente"
                      value={config.titulo_fuente}
                      onChange={(e) => updateConfig('titulo_fuente', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="times">Times</option>
                      <option value="helvetica">Helvetica</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titulo_estilo">Estilo</Label>
                    <select
                      id="titulo_estilo"
                      value={config.titulo_estilo}
                      onChange={(e) => updateConfig('titulo_estilo', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Negrita</option>
                      <option value="italic">Cursiva</option>
                      <option value="bolditalic">Negrita Cursiva</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titulo_tamano">Tamaño (pt)</Label>
                    <Input
                      id="titulo_tamano"
                      type="number"
                      value={config.titulo_tamano}
                      onChange={(e) => updateConfig('titulo_tamano', parseInt(e.target.value))}
                      min="10"
                      max="72"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Nombre */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Nombre del Participante</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_fuente">Fuente</Label>
                    <select
                      id="nombre_fuente"
                      value={config.nombre_fuente}
                      onChange={(e) => updateConfig('nombre_fuente', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="times">Times</option>
                      <option value="helvetica">Helvetica</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre_estilo">Estilo</Label>
                    <select
                      id="nombre_estilo"
                      value={config.nombre_estilo}
                      onChange={(e) => updateConfig('nombre_estilo', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Negrita</option>
                      <option value="italic">Cursiva</option>
                      <option value="bolditalic">Negrita Cursiva</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre_tamano">Tamaño (pt)</Label>
                    <Input
                      id="nombre_tamano"
                      type="number"
                      value={config.nombre_tamano}
                      onChange={(e) => updateConfig('nombre_tamano', parseInt(e.target.value))}
                      min="10"
                      max="72"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cuerpo */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Texto del Cuerpo</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuerpo_fuente">Fuente</Label>
                    <select
                      id="cuerpo_fuente"
                      value={config.cuerpo_fuente}
                      onChange={(e) => updateConfig('cuerpo_fuente', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="times">Times</option>
                      <option value="helvetica">Helvetica</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuerpo_estilo">Estilo</Label>
                    <select
                      id="cuerpo_estilo"
                      value={config.cuerpo_estilo}
                      onChange={(e) => updateConfig('cuerpo_estilo', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Negrita</option>
                      <option value="italic">Cursiva</option>
                      <option value="bolditalic">Negrita Cursiva</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuerpo_tamano">Tamaño (pt)</Label>
                    <Input
                      id="cuerpo_tamano"
                      type="number"
                      value={config.cuerpo_tamano}
                      onChange={(e) => updateConfig('cuerpo_tamano', parseInt(e.target.value))}
                      min="8"
                      max="24"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Logo */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Logo</CardTitle>
              <CardDescription>Personaliza la posición y tamaño del logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subir Logo */}
              <div className="space-y-2">
                <Label htmlFor="logo_file">Subir Logo desde Dispositivo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="logo_file"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Formatos permitidos: PNG, JPG, WEBP (máx. 5MB)
                    </p>
                  </div>
                  {uploadingLogo && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Subiendo...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vista Previa del Logo */}
              {logoPreview && (
                <div className="space-y-2">
                  <Label>Vista Previa del Logo</Label>
                  <div className="relative inline-block border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <img
                      src={logoPreview}
                      alt="Vista previa del logo"
                      className="max-w-xs max-h-48 object-contain"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Eliminar logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <Separator />

              {/* URL del Logo (alternativa) */}
              <div className="space-y-2">
                <Label htmlFor="logo_url">URL del Logo (Alternativa)</Label>
                <Input
                  id="logo_url"
                  type="text"
                  value={config.logo_url}
                  onChange={(e) => {
                    updateConfig('logo_url', e.target.value)
                    // Actualizar vista previa si es una URL válida
                    if (e.target.value.startsWith('http') || e.target.value.startsWith('/')) {
                      setLogoPreview(e.target.value.startsWith('/') 
                        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'}${e.target.value}`
                        : e.target.value
                      )
                    }
                  }}
                  placeholder="/sansi-logo.png"
                />
                <p className="text-sm text-gray-500">Ruta relativa desde la carpeta public o URL completa</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_tamano">Tamaño (px)</Label>
                  <Input
                    id="logo_tamano"
                    type="number"
                    value={config.logo_tamano}
                    onChange={(e) => updateConfig('logo_tamano', parseInt(e.target.value))}
                    min="50"
                    max="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_posicion_x">Posición X (mm)</Label>
                  <Input
                    id="logo_posicion_x"
                    type="number"
                    value={config.logo_posicion_x}
                    onChange={(e) => updateConfig('logo_posicion_x', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_posicion_y">Posición Y</Label>
                  <select
                    id="logo_posicion_y"
                    value={config.logo_posicion_y}
                    onChange={(e) => updateConfig('logo_posicion_y', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="center">Centro</option>
                    <option value="top">Arriba</option>
                    <option value="bottom">Abajo</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Textos */}
        <TabsContent value="textos">
          <Card>
            <CardHeader>
              <CardTitle>Textos Personalizables</CardTitle>
              <CardDescription>
                Personaliza los textos del certificado. Usa variables: {"{puesto}"}, {"{medalla}"}, {"{area}"}, {"{gestion}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="texto_honor">Texto para Certificado de Honor</Label>
                <textarea
                  id="texto_honor"
                  value={config.texto_honor}
                  onChange={(e) => updateConfig('texto_honor', e.target.value)}
                  className="w-full p-2 border rounded min-h-[100px]"
                  placeholder="Por haber obtenido {puesto} {medalla} en el área de {area}, durante la gestión {gestion}."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="texto_participacion">Texto para Certificado de Participación</Label>
                <textarea
                  id="texto_participacion"
                  value={config.texto_participacion}
                  onChange={(e) => updateConfig('texto_participacion', e.target.value)}
                  className="w-full p-2 border rounded min-h-[100px]"
                  placeholder="Por su valiosa participación en el área de {area} durante la gestión {gestion}, demostrando compromiso con la ciencia y la tecnología."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="texto_firma_izquierda">Texto Firma Izquierda</Label>
                  <Input
                    id="texto_firma_izquierda"
                    type="text"
                    value={config.texto_firma_izquierda}
                    onChange={(e) => updateConfig('texto_firma_izquierda', e.target.value)}
                    placeholder="Coordinador de Área"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="texto_firma_derecha">Texto Firma Derecha</Label>
                  <Input
                    id="texto_firma_derecha"
                    type="text"
                    value={config.texto_firma_derecha}
                    onChange={(e) => updateConfig('texto_firma_derecha', e.target.value)}
                    placeholder="Director / Autoridad"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="texto_pie_pagina">Texto Pie de Página</Label>
                <Input
                  id="texto_pie_pagina"
                  type="text"
                  value={config.texto_pie_pagina}
                  onChange={(e) => updateConfig('texto_pie_pagina', e.target.value)}
                  placeholder="SanSi · Olimpiada de Ciencia y Tecnología · Certificado Oficial"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Espaciado */}
        <TabsContent value="espaciado">
          <Card>
            <CardHeader>
              <CardTitle>Espaciado y Bordes</CardTitle>
              <CardDescription>Personaliza los márgenes y el radio de los bordes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="margen">Margen (mm)</Label>
                  <Input
                    id="margen"
                    type="number"
                    value={config.margen}
                    onChange={(e) => updateConfig('margen', parseInt(e.target.value))}
                    min="5"
                    max="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radio_borde">Radio del Borde (mm)</Label>
                  <Input
                    id="radio_borde"
                    type="number"
                    value={config.radio_borde}
                    onChange={(e) => updateConfig('radio_borde', parseInt(e.target.value))}
                    min="0"
                    max="20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Vista Previa */}
      <CertificatePreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        config={config}
      />
    </div>
  )
}

