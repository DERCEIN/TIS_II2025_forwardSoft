"use client"

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FileSpreadsheet,
  Users,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { 
  useImportarOlimpistas, 
  useDescargarPlantilla, 
  useValidarArchivoCSV,
  useProcesarResultadosImportacion,
  useErroresImportacion,
  useResumenImportacion,
  ImportResult
} from '@/hooks/useImportacion'
import { useNotifications } from '@/components/NotificationProvider'

export default function ImportarOlimpistasPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Hooks de importación
  const { importar, loading: importing, error: importError, result } = useImportarOlimpistas()
  const { descargar, loading: downloading } = useDescargarPlantilla()
  const { validaciones, validar, limpiar: limpiarValidaciones } = useValidarArchivoCSV()
  const { estadisticas, procesar: procesarEstadisticas, limpiar: limpiarEstadisticas } = useProcesarResultadosImportacion()
  const { erroresDetallados, procesarErrores, limpiar: limpiarErrores } = useErroresImportacion()
  const { resumen, generar: generarResumen, limpiar: limpiarResumen } = useResumenImportacion()
  
  const { success, error: showError, warning, info } = useNotifications()
  
  // Función para limpiar la tabla
  const limpiarTabla = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/olimpistas/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        success(`Tabla limpiada exitosamente. Se eliminaron ${data.data.deleted_count} registros.`)
        // Limpiar todos los estados
        limpiarValidaciones()
        limpiarEstadisticas()
        limpiarErrores()
        limpiarResumen()
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        showError('Error al limpiar la tabla: ' + data.error)
      }
    } catch (error) {
      showError('Error al limpiar la tabla: ' + error)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      limpiarValidaciones()
      limpiarEstadisticas()
      limpiarErrores()
      limpiarResumen()
      validar(file)
    }
  }

  // Manejar importación
  const handleImport = async () => {
    if (!selectedFile) return

    try {
      const result = await importar(selectedFile)
      
      // Procesar resultados
      procesarEstadisticas(result)
      procesarErrores(result)
      generarResumen(result)
      
      // Mostrar notificación
      if (result.errors.length === 0) {
        success('Importación exitosa', `Se importaron ${result.successful_imports} olimpistas correctamente`)
      } else if (result.successful_imports > 0) {
        warning('Importación parcial', `Se importaron ${result.successful_imports} olimpistas, ${result.errors.length} errores`)
      } else {
        showError('Importación fallida', `No se pudo importar ningún olimpista. ${result.errors.length} errores encontrados`)
      }
    } catch (err: any) {
      showError('Error de importación', err.message)
    }
  }

  // Manejar descarga de plantilla
  const handleDownloadTemplate = async () => {
    try {
      await descargar()
      success('Plantilla descargada', 'La plantilla CSV se ha descargado correctamente')
    } catch (err: any) {
      showError('Error al descargar', err.message)
    }
  }

  // Limpiar archivo seleccionado
  const clearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    limpiarValidaciones()
    limpiarEstadisticas()
    limpiarErrores()
    limpiarResumen()
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold">Importar Olimpistas</h1>
              <p className="text-muted-foreground">Registra participantes desde archivo CSV</p>
            </div>
          </div>
        </div>

        {/* Información y plantilla */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Plantilla CSV
            </CardTitle>
            <CardDescription>
              Descarga la plantilla para asegurar el formato correcto de los datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Plantilla de Olimpistas</p>
                  <p className="text-sm text-muted-foreground">
                    Incluye todas las columnas necesarias con ejemplos
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleDownloadTemplate} 
                  disabled={downloading}
                  className="flex items-center"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Descargar Plantilla
                </Button>
                <Button 
                  onClick={limpiarTabla}
                  variant="outline"
                  className="flex items-center text-red-600 hover:text-red-700"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Limpiar Tabla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selección de archivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Seleccionar Archivo CSV
            </CardTitle>
            <CardDescription>
              Selecciona el archivo CSV con los datos de los olimpistas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Área de drop */}
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo CSV'}
              </p>
              <p className="text-sm text-muted-foreground">
                O arrastra y suelta el archivo aquí
              </p>
            </div>

            {/* Validaciones */}
            {selectedFile && validaciones.errores.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Errores encontrados:</p>
                    {validaciones.errores.map((error, index) => (
                      <p key={index} className="text-sm">• {error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {selectedFile && validaciones.advertencias.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Advertencias:</p>
                    {validaciones.advertencias.map((warning, index) => (
                      <p key={index} className="text-sm">• {warning}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Botones de acción */}
            {selectedFile && validaciones.esValido && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={clearFile}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                  className="flex items-center"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Importar Olimpistas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados de importación */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Resultados de Importación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumen */}
              {resumen && (
                <Alert variant={resumen.tipo === 'success' ? 'default' : resumen.tipo === 'warning' ? 'default' : 'destructive'}>
                  {resumen.tipo === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : resumen.tipo === 'warning' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{resumen.mensaje}</p>
                      <div className="space-y-1">
                        {resumen.detalles.map((detalle, index) => (
                          <p key={index} className="text-sm">• {detalle}</p>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Estadísticas */}
              {estadisticas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">{estadisticas.totalFilas}</p>
                    <p className="text-sm text-muted-foreground">Total Filas</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{estadisticas.exitosos}</p>
                    <p className="text-sm text-muted-foreground">Exitosos</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{estadisticas.errores}</p>
                    <p className="text-sm text-muted-foreground">Errores</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{estadisticas.porcentajeExito}%</p>
                    <p className="text-sm text-muted-foreground">Éxito</p>
                  </div>
                </div>
              )}

              {/* Errores detallados */}
              {erroresDetallados.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-semibold">Errores y Advertencias Detallados</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {erroresDetallados.map((error, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Badge variant={error.tipo === 'error' ? 'destructive' : 'secondary'}>
                          Fila {error.fila}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{error.error}</p>
                          {error.datos.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Datos: {error.datos.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón para nueva importación */}
              <div className="flex justify-end">
                <Button onClick={clearFile} variant="outline">
                  Nueva Importación
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error de importación */}
        {importError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Error en la importación:</p>
              <p className="text-sm mt-1">{importError}</p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
