"use client"

import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import { X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CertificatePreviewModalProps {
  open: boolean
  onClose: () => void
  config: any
}

export default function CertificatePreviewModal({
  open,
  onClose,
  config
}: CertificatePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Función auxiliar para convertir color hex a RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0]
  }

  // Función para reemplazar variables en texto
  const replaceTextVariables = (
    text: string,
    puesto: string | null,
    medalla: string | null,
    area: string,
    gestion: string
  ): string => {
    return text
      .replace(/{puesto}/g, puesto ? `el ${puesto} puesto` : "un destacado desempeño")
      .replace(/{medalla}/g, medalla ? ` y la medalla de ${medalla}` : "")
      .replace(/{area}/g, area || "-")
      .replace(/{gestion}/g, gestion)
  }

  const formatPuesto = (puesto?: number | null) => {
    if (!puesto) return null
    const ordMap: Record<number, string> = { 1: "1.º", 2: "2.º", 3: "3.º" }
    return ordMap[puesto] || `${puesto}.º`
  }

  const formatMedal = (estado?: string | null) => {
    if (!estado) return null
    const map: Record<string, string> = {
      oro: "Oro",
      plata: "Plata",
      bronce: "Bronce",
      mencion_honor: "Mención de Honor",
      mencion: "Mención de Honor"
    }
    return map[String(estado).toLowerCase()] || null
  }

  const generatePreview = async () => {
    if (!config) return

    try {
      setGenerating(true)

      // Usar configuración o valores por defecto
      const cfg = config || {
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
      }

      // Datos de ejemplo para la vista previa
      const ejemploParticipante = {
        id: 12345,
        nombre: "Juan Pérez García",
        unidad: "Unidad Educativa Ejemplo",
        area: "Matemáticas",
        nivel: "Secundaria",
        puntaje: 95.5,
        puesto: 1,
        estado: "oro"
      }

      // Construir URL completa del logo
      let logoSrc = cfg.logo_url || "/sansi-logo.png"
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'
      
      if (logoSrc.startsWith('/uploads/certificados/logos/')) {
        // Si es un logo subido, usar la ruta de API
        const filename = logoSrc.split('/').pop()
        logoSrc = `${apiUrl}/api/certificados/logo/${filename}`
      } else if (logoSrc.startsWith('/uploads/')) {
        // Si es otra ruta de uploads, construir URL completa
        logoSrc = `${apiUrl}${logoSrc}`
      } else if (logoSrc.startsWith('/') && !logoSrc.startsWith('//')) {
        // Si es una ruta relativa que no es uploads, usar la URL base
        logoSrc = `${apiUrl}${logoSrc}`
      }
      
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = (err) => {
            console.error('Error cargando logo:', src, err)
            reject(new Error("Error cargando imagen"))
          }
          img.src = src
        })

      let logoImg: HTMLImageElement | null = null
      try {
        logoImg = await loadImage(logoSrc)
      } catch (e) {
        console.warn(`No se pudo cargar logo en ${logoSrc}. El PDF seguirá sin logo.`)
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = cfg.margen || 15

      const yearLabel = new Date().getFullYear().toString()
      const puestoText = formatPuesto(ejemploParticipante.puesto)
      const medalText = formatMedal(ejemploParticipante.estado)

      // Usar textos personalizados
      const honorTextTemplate = cfg.texto_honor || 'Por haber obtenido {puesto} {medalla} en el área de {area}, durante la gestión {gestion}.'
      const honorText = replaceTextVariables(
        honorTextTemplate,
        puestoText,
        medalText,
        ejemploParticipante.area,
        yearLabel
      )

      const innerWidth = pageWidth - margin * 2
      const innerHeight = pageHeight - margin * 2

      // Colores de fondo
      const fondoRgb = hexToRgb(cfg.fondo_color)
      pdf.setFillColor(fondoRgb[0], fondoRgb[1], fondoRgb[2])
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      const fondoInternoRgb = hexToRgb('#F5F8FF')
      pdf.setFillColor(fondoInternoRgb[0], fondoInternoRgb[1], fondoInternoRgb[2])
      const radioBorde = cfg.radio_borde || 6
      pdf.roundedRect(margin, margin, innerWidth, innerHeight, radioBorde, radioBorde, "F")

      // Borde principal
      const bordeRgb = hexToRgb(cfg.borde_color)
      pdf.setDrawColor(bordeRgb[0], bordeRgb[1], bordeRgb[2])
      pdf.setLineWidth(1.5)
      pdf.roundedRect(margin, margin, innerWidth, innerHeight, radioBorde, radioBorde)

      // Borde secundario
      const bordeSecRgb = hexToRgb(cfg.borde_secundario_color)
      pdf.setDrawColor(bordeSecRgb[0], bordeSecRgb[1], bordeSecRgb[2])
      pdf.setLineWidth(0.4)
      pdf.roundedRect(margin + 5, margin + 5, innerWidth - 10, innerHeight - 10, 4, 4)

      // Patrón binario lateral
      pdf.setFont("courier", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(212, 218, 236)
      for (let y = margin + 12; y < pageHeight - margin; y += 9) {
        pdf.text("0101010101", margin - 3, y, undefined, 90)
      }

      // Logo
      const logoPosX = margin + (cfg.logo_posicion_x || 45)
      let logoPosY = pageHeight / 2
      if (cfg.logo_posicion_y === 'top') {
        logoPosY = margin + 50
      } else if (cfg.logo_posicion_y === 'bottom') {
        logoPosY = pageHeight - margin - 50
      }

      if (logoImg) {
        const logoSize = cfg.logo_tamano || 130
        pdf.addImage(logoImg, "PNG", logoPosX - logoSize / 2, logoPosY - logoSize / 2, logoSize, logoSize)
      }

      // Encabezado
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(13)
      const textoPrincipalRgb = hexToRgb(cfg.texto_principal_color)
      pdf.setTextColor(textoPrincipalRgb[0], textoPrincipalRgb[1], textoPrincipalRgb[2])
      pdf.text(["Olimpiada de", "Ciencia y Tecnología"], pageWidth - margin - 18, margin + 15, { align: "right" })
      pdf.setFontSize(24)
      pdf.text(yearLabel, pageWidth - margin - 18, margin + 33, { align: "right" })

      // Contenido principal
      const contentX = pageWidth / 2 + 35
      pdf.setTextColor(textoPrincipalRgb[0], textoPrincipalRgb[1], textoPrincipalRgb[2])
      pdf.setFont(cfg.titulo_fuente || "times", cfg.titulo_estilo || "bold")
      pdf.setFontSize(cfg.titulo_tamano || 36)
      pdf.text("CERTIFICADO", contentX, margin + 42, { align: "center" })
      pdf.setFont("times", "italic")
      pdf.setFontSize(16)
      pdf.text("ENTREGADO A", contentX, margin + 57, { align: "center" })

      // Nombre
      pdf.setFont(cfg.nombre_fuente || "times", cfg.nombre_estilo || "bold")
      pdf.setFontSize(cfg.nombre_tamano || 54)
      const textoSecundarioRgb = hexToRgb(cfg.texto_secundario_color)
      pdf.setTextColor(textoSecundarioRgb[0], textoSecundarioRgb[1], textoSecundarioRgb[2])
      pdf.text(ejemploParticipante.nombre, contentX, margin + 78, { align: "center" })

      // Unidad y cuerpo
      pdf.setFont("times", "italic")
      pdf.setFontSize(15)
      pdf.setTextColor(textoSecundarioRgb[0], textoSecundarioRgb[1], textoSecundarioRgb[2])
      pdf.text(`De la Unidad Educativa ${ejemploParticipante.unidad}`, contentX, margin + 94, { align: "center" })

      pdf.setFont(cfg.cuerpo_fuente || "times", cfg.cuerpo_estilo || "normal")
      pdf.setFontSize(cfg.cuerpo_tamano || 14)
      pdf.text(honorText, contentX, margin + 100, {
        align: "center",
        maxWidth: innerWidth - 120
      })

      // Bloque de datos
      const dataBoxY = margin + 119
      pdf.setDrawColor(194, 202, 230)
      pdf.setFillColor(255, 255, 255)
      pdf.roundedRect(contentX - 90, dataBoxY, 180, 32, 3, 3, "FD")
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(10)
      pdf.setTextColor(26, 55, 112)
      pdf.text(`Área:`, contentX - 80, dataBoxY + 11)
      pdf.text(`Nivel:`, contentX - 80, dataBoxY + 21)
      pdf.text(`Puesto/Medalla:`, contentX + 5, dataBoxY + 11)
      pdf.text(`Código:`, contentX + 5, dataBoxY + 21)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(40, 40, 40)
      pdf.text(ejemploParticipante.area, contentX - 45, dataBoxY + 11)
      pdf.text(ejemploParticipante.nivel, contentX - 45, dataBoxY + 21)
      const puestoMedalla = medalText
        ? `${puestoText ?? "Reconocimiento"} · ${medalText}`
        : puestoText ?? "Participación"
      pdf.text(puestoMedalla, contentX + 55, dataBoxY + 11, { align: "center" })
      const code = `SS-${String(ejemploParticipante.id).padStart(5, "0")}`
      pdf.text(code, contentX + 55, dataBoxY + 21, { align: "center" })

      // Leyenda lateral
      pdf.setFont("times", "italic")
      pdf.setFontSize(12)
      pdf.setTextColor(24, 74, 131)
      pdf.text("Olimpiada de", logoPosX, logoPosY + 50, { align: "center" })
      pdf.text("Ciencia y Tecnología", logoPosX, logoPosY + 60, { align: "center" })

      // Zona de firmas
      const signatureY = pageHeight - 35
      const leftSigX = logoPosX + 60
      const rightSigX = pageWidth - margin - 60
      pdf.setDrawColor(60, 60, 60)
      pdf.setLineWidth(0.5)
      pdf.line(leftSigX - 40, signatureY, leftSigX + 40, signatureY)
      pdf.line(rightSigX - 40, signatureY, rightSigX + 40, signatureY)
      pdf.setFont("times", "italic")
      pdf.setFontSize(12)
      pdf.setTextColor(0, 0, 0)
      pdf.text(cfg.texto_firma_izquierda || "Coordinador de Área", leftSigX, signatureY + 10, { align: "center" })
      pdf.text(cfg.texto_firma_derecha || "Director / Autoridad", rightSigX, signatureY + 10, { align: "center" })

      // Pie de página
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(115, 120, 140)
      pdf.text(cfg.texto_pie_pagina || "SanSi · Olimpiada de Ciencia y Tecnología · Certificado Oficial", pageWidth / 2, pageHeight - 6, { align: "center" })

      // Generar URL del PDF para vista previa
      const pdfBlob = pdf.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error generando vista previa:', error)
      alert('Error al generar la vista previa del certificado')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (open && config) {
      generatePreview()
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [open, config])

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = 'vista_previa_certificado.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Vista Previa del Certificado</h2>
          <div className="flex gap-2">
            {previewUrl && (
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4">
          {generating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generando vista previa...</p>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="w-full h-full">
              <iframe
                src={previewUrl}
                className="w-full h-[calc(90vh-120px)] border rounded"
                title="Vista previa del certificado"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No se pudo generar la vista previa</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            <strong>Nota:</strong> Esta es una vista previa con datos de ejemplo. Los certificados reales se generarán con los datos de los participantes seleccionados.
          </p>
        </div>
      </div>
    </div>
  )
}

