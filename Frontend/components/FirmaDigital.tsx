'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Trash2, Save, CheckCircle2, Pen, X, AlertCircle, Info } from 'lucide-react'
import { Badge } from './ui/badge'

interface FirmaDigitalProps {
  onGuardar: (firmaImagen: string) => Promise<void>
  firmaExistente?: string | null
  fechaFirma?: string | null
  reporteTipo?: string
}

export default function FirmaDigital({ 
  onGuardar, 
  firmaExistente, 
  fechaFirma,
  reporteTipo = 'cierre_fase' 
}: FirmaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [lineWidth, setLineWidth] = useState(2.5)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  
  // Para suavizado de líneas
  const pointsRef = useRef<Array<{ x: number; y: number; time: number }>>([])
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const smoothingLevel = 0.3 // Nivel de suavizado (0-1, mayor = más suave)

  // Configurar canvas con alta resolución
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    if (!ctx) return

    // Obtener tamaño del contenedor
    const rect = container.getBoundingClientRect()
    const width = Math.floor(rect.width)
    const height = 200 // Altura fija para mejor UX

    // Configurar canvas con alta resolución para mejor calidad
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Escalar contexto para alta resolución
    ctx.scale(dpr, dpr)

    // Configurar estilo de dibujo
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = 'source-over'

    setCanvasSize({ width, height })

    // Si hay una firma existente, cargarla
    if (firmaExistente) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        setHasSignature(true)
      }
      img.src = firmaExistente
    } else {
      // Limpiar canvas
      ctx.clearRect(0, 0, width, height)
      setHasSignature(false)
    }
  }, [firmaExistente, lineWidth])

  useEffect(() => {
    setupCanvas()

    // Manejar resize
    const handleResize = () => {
      setupCanvas()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupCanvas])

  const getPointFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * dpr,
        y: (e.touches[0].clientY - rect.top) * dpr
      }
    } else {
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr
      }
    }
  }

  // Función para suavizar puntos usando interpolación cuadrática
  const smoothPoint = (current: { x: number; y: number }, previous: { x: number; y: number } | null, beforePrevious: { x: number; y: number } | null) => {
    if (!previous) return current
    if (!beforePrevious) {
      // Si solo hay un punto anterior, interpolar entre ellos
      return {
        x: previous.x + (current.x - previous.x) * smoothingLevel,
        y: previous.y + (current.y - previous.y) * smoothingLevel
      }
    }
    
    // Interpolación cuadrática para suavizado más avanzado
    return {
      x: previous.x + (current.x - previous.x) * smoothingLevel,
      y: previous.y + (current.y - previous.y) * smoothingLevel
    }
  }

  // Función para calcular distancia entre dos puntos
  const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const point = getPointFromEvent(e)
    if (!point) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.lineWidth = lineWidth * dpr
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Reiniciar puntos para el nuevo trazo
    pointsRef.current = [{
      x: point.x,
      y: point.y,
      time: Date.now()
    }]
    lastPointRef.current = { x: point.x, y: point.y }

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(point.x / dpr, point.y / dpr)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const point = getPointFromEvent(e)
    if (!point) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    // Agregar punto al buffer (guardar en coordenadas de canvas escaladas)
    pointsRef.current.push({
      x: point.x,
      y: point.y,
      time: Date.now()
    })

    // Mantener solo los últimos 5 puntos para el suavizado
    if (pointsRef.current.length > 5) {
      pointsRef.current.shift()
    }

    // Calcular punto suavizado
    const previousPoint = pointsRef.current.length >= 2 
      ? pointsRef.current[pointsRef.current.length - 2] 
      : null
    const beforePreviousPoint = pointsRef.current.length >= 3 
      ? pointsRef.current[pointsRef.current.length - 3] 
      : null

    let smoothedPoint = point
    
    if (lastPointRef.current) {
      // Calcular distancia para filtrar movimientos muy pequeños (temblor)
      const dist = distance(lastPointRef.current, point)
      
      // Si la distancia es muy pequeña, ignorar (reduce temblor)
      if (dist < 1) {
        return
      }

      // Suavizado básico: interpolar entre el último punto y el actual
      smoothedPoint = {
        x: lastPointRef.current.x + (point.x - lastPointRef.current.x) * smoothingLevel,
        y: lastPointRef.current.y + (point.y - lastPointRef.current.y) * smoothingLevel
      }

      // Suavizado avanzado con interpolación cuadrática si hay suficientes puntos
      if (beforePreviousPoint && previousPoint) {
        // Calcular punto medio entre el anterior y el actual
        const midX = (previousPoint.x + point.x) / 2
        const midY = (previousPoint.y + point.y) / 2
        
        // Combinar suavizado básico con punto medio para curvas más naturales
        smoothedPoint = {
          x: smoothedPoint.x * 0.6 + midX * 0.4,
          y: smoothedPoint.y * 0.6 + midY * 0.4
        }
      }
    }

    // Dibujar línea suavizada usando curva cuadrática de Bezier
    // El contexto ya está escalado por dpr, así que dividimos las coordenadas
    if (lastPointRef.current) {
      // Punto de control para la curva cuadrática (punto medio)
      const controlX = (lastPointRef.current.x + smoothedPoint.x) / 2
      const controlY = (lastPointRef.current.y + smoothedPoint.y) / 2

      // Usar curva cuadrática para líneas más suaves
      ctx.quadraticCurveTo(
        controlX / dpr,
        controlY / dpr,
        smoothedPoint.x / dpr,
        smoothedPoint.y / dpr
      )
    } else {
      // Primer punto del trazo
      ctx.lineTo(smoothedPoint.x / dpr, smoothedPoint.y / dpr)
    }

    ctx.stroke()
    lastPointRef.current = smoothedPoint
    setHasSignature(true)
    setGuardado(false)
  }

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault()
    
    // Limpiar el buffer de puntos
    pointsRef.current = []
    lastPointRef.current = null
    
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setGuardado(false)
  }

  const handleGuardar = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    try {
      setGuardando(true)
      // Exportar con alta calidad
      const firmaImagen = canvas.toDataURL('image/png', 1.0)
      await onGuardar(firmaImagen)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch (error) {
      console.error('Error guardando firma:', error)
      alert('Error al guardar la firma. Por favor, intente nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Pen className="h-5 w-5 text-blue-600" />
              Firma Digital
            </CardTitle>
            <CardDescription className="mt-1.5">
              Firma el reporte de cierre de fase clasificatoria
            </CardDescription>
          </div>
          {fechaFirma && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1.5" />
              Firmado {new Date(fechaFirma).toLocaleDateString('es-BO', { 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
              })}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Área de firma */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Dibuje su firma en el área de abajo
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Grosor:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLineWidth(1.5)}
                  className={`h-7 px-2 ${lineWidth === 1.5 ? 'bg-blue-100' : ''}`}
                >
                  <div className="w-4 h-1 bg-gray-600 rounded"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLineWidth(2.5)}
                  className={`h-7 px-2 ${lineWidth === 2.5 ? 'bg-blue-100' : ''}`}
                >
                  <div className="w-4 h-1.5 bg-gray-600 rounded"></div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLineWidth(3.5)}
                  className={`h-7 px-2 ${lineWidth === 3.5 ? 'bg-blue-100' : ''}`}
                >
                  <div className="w-4 h-2 bg-gray-600 rounded"></div>
                </Button>
              </div>
            </div>
          </div>

          <div 
            ref={containerRef}
            className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-all hover:border-blue-400 hover:shadow-md"
          >
            {!hasSignature && !firmaExistente && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Pen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">
                    Dibuje su firma aquí
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use el mouse o su dedo en dispositivos táctiles
                  </p>
                </div>
              </div>
            )}
            
            <canvas
              ref={canvasRef}
              className="w-full h-[200px] cursor-crosshair touch-none rounded"
              style={{ 
                backgroundColor: 'transparent',
                imageRendering: 'crisp-edges'
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {hasSignature && !firmaExistente && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>No olvide guardar su firma antes de continuar</span>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={clearCanvas}
              disabled={!hasSignature || guardando || !!firmaExistente}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            
            {firmaExistente && (
              <Button
                variant="outline"
                onClick={clearCanvas}
                disabled={guardando}
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reemplazar Firma
              </Button>
            )}
          </div>

          <Button
            onClick={handleGuardar}
            disabled={!hasSignature || guardando}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            size="lg"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Guardando...
              </>
            ) : guardado ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Guardado
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Firma
              </>
            )}
          </Button>
        </div>

        {/* Información adicional */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Información importante:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Su firma será asociada al reporte de cierre de fase</li>
                <li>Puede actualizar su firma en cualquier momento</li>
                <li>La firma se guarda de forma segura en el sistema</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
