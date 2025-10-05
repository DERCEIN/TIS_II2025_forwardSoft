"use client"

import { useState } from 'react'
import { ImportService, ApiResponse } from '@/lib/api'


export interface ImportResult {
  total_rows: number
  successful_imports: number
  errors: Array<{
    row: number
    error: string
    data: any[]
  }>
  warnings: Array<{
    row: number
    warning: string
    documento?: string
  }>
}


export const useImportarOlimpistas = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const importar = async (file: File) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('El archivo debe ser de tipo CSV')
      }

      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo no puede ser mayor a 5MB')
      }

      const response = await ImportService.importOlimpistas(file)
      if (response.success && response.data) {
        setResult(response.data)
        return response.data
      } else {
        throw new Error(response.message || 'Error al importar olimpistas')
      }
    } catch (err: any) {
      setError(err.message || 'Error al importar olimpistas')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearResult = () => {
    setResult(null)
    setError(null)
  }

  return {
    importar,
    loading,
    error,
    result,
    clearResult,
  }
}


export const useDescargarPlantilla = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const descargar = async () => {
    setLoading(true)
    setError(null)

    try {
      await ImportService.downloadTemplate()
    } catch (err: any) {
      setError(err.message || 'Error al descargar la plantilla')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    descargar,
    loading,
    error,
  }
}


export const useValidarArchivoCSV = () => {
  const [validaciones, setValidaciones] = useState<{
    esValido: boolean
    errores: string[]
    advertencias: string[]
  }>({
    esValido: false,
    errores: [],
    advertencias: []
  })

  const validar = (file: File) => {
    const errores: string[] = []
    const advertencias: string[] = []

    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errores.push('El archivo debe ser de tipo CSV')
    }

    
    if (file.size > 5 * 1024 * 1024) {
      errores.push('El archivo no puede ser mayor a 5MB')
    }

    
    if (file.size > 2 * 1024 * 1024) {
      advertencias.push('El archivo es grande, la importación puede tardar varios minutos')
    }

    
    if (!file.name.includes('olimpistas') && !file.name.includes('template')) {
      advertencias.push('El nombre del archivo no sugiere que contenga datos de olimpistas')
    }

    const esValido = errores.length === 0

    setValidaciones({
      esValido,
      errores,
      advertencias
    })

    return esValido
  }

  const limpiar = () => {
    setValidaciones({
      esValido: false,
      errores: [],
      advertencias: []
    })
  }

  return {
    validaciones,
    validar,
    limpiar
  }
}


export const useProcesarResultadosImportacion = () => {
  const [estadisticas, setEstadisticas] = useState<{
    totalFilas: number
    exitosos: number
    errores: number
    advertencias: number
    porcentajeExito: number
  } | null>(null)

  const procesar = (result: ImportResult) => {
    const totalFilas = result.total_rows
    const exitosos = result.successful_imports
    const errores = result.errors.length
    const advertencias = result.warnings.length
    const porcentajeExito = totalFilas > 0 ? Math.round((exitosos / totalFilas) * 100) : 0

    const estadisticasCalculadas = {
      totalFilas,
      exitosos,
      errores,
      advertencias,
      porcentajeExito
    }

    setEstadisticas(estadisticasCalculadas)
    return estadisticasCalculadas
  }

  const limpiar = () => {
    setEstadisticas(null)
  }

  return {
    estadisticas,
    procesar,
    limpiar
  }
}


export const useErroresImportacion = () => {
  const [erroresDetallados, setErroresDetallados] = useState<Array<{
    fila: number
    error: string
    datos: any[]
    tipo: 'error' | 'advertencia'
  }>>([])

  const procesarErrores = (result: ImportResult) => {
    const errores = result.errors.map(error => ({
      fila: error.row,
      error: error.error,
      datos: error.data,
      tipo: 'error' as const
    }))

    const advertencias = result.warnings.map(warning => ({
      fila: warning.row,
      error: warning.warning,
      datos: [],
      tipo: 'advertencia' as const
    }))

    const todosLosErrores = [...errores, ...advertencias]
    setErroresDetallados(todosLosErrores)
    return todosLosErrores
  }

  const limpiar = () => {
    setErroresDetallados([])
  }

  const filtrarPorTipo = (tipo: 'error' | 'advertencia') => {
    return erroresDetallados.filter(error => error.tipo === tipo)
  }

  const obtenerErroresPorFila = (fila: number) => {
    return erroresDetallados.filter(error => error.fila === fila)
  }

  return {
    erroresDetallados,
    procesarErrores,
    limpiar,
    filtrarPorTipo,
    obtenerErroresPorFila
  }
}


export const useResumenImportacion = () => {
  const [resumen, setResumen] = useState<{
    mensaje: string
    tipo: 'success' | 'warning' | 'error'
    detalles: string[]
  } | null>(null)

  const generar = (result: ImportResult) => {
    const totalFilas = result.total_rows
    const exitosos = result.successful_imports
    const errores = result.errors.length
    const advertencias = result.warnings.length
    const porcentajeExito = totalFilas > 0 ? Math.round((exitosos / totalFilas) * 100) : 0

    let mensaje = ''
    let tipo: 'success' | 'warning' | 'error' = 'success'
    const detalles: string[] = []

    if (errores === 0 && advertencias === 0) {
      mensaje = `Importación exitosa: ${exitosos} olimpistas importados correctamente`
      tipo = 'success'
    } else if (errores === 0) {
      mensaje = `Importación completada con advertencias: ${exitosos} olimpistas importados, ${advertencias} advertencias`
      tipo = 'warning'
    } else if (exitosos > 0) {
      mensaje = `Importación parcial: ${exitosos} olimpistas importados, ${errores} errores`
      tipo = 'warning'
    } else {
      mensaje = `Importación fallida: ${errores} errores encontrados`
      tipo = 'error'
    }

    detalles.push(`Total de filas procesadas: ${totalFilas}`)
    detalles.push(`Importaciones exitosas: ${exitosos}`)
    if (errores > 0) detalles.push(`Errores: ${errores}`)
    if (advertencias > 0) detalles.push(`Advertencias: ${advertencias}`)
    detalles.push(`Porcentaje de éxito: ${porcentajeExito}%`)

    const resumenGenerado = {
      mensaje,
      tipo,
      detalles
    }

    setResumen(resumenGenerado)
    return resumenGenerado
  }

  const limpiar = () => {
    setResumen(null)
  }

  return {
    resumen,
    generar,
    limpiar
  }
}





