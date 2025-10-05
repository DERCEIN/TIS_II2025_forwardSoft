"use client"

import { useState, useEffect, useCallback } from 'react'
import { ReporteService, ApiResponse } from '@/lib/api'


export interface EstadisticasGenerales {
  total_olimpistas: number
  total_inscripciones: number
  inscripciones_por_area: Array<{
    area: string
    total: number
  }>
  inscripciones_por_nivel: Array<{
    nivel: string
    total: number
  }>
  inscripciones_por_departamento: Array<{
    departamento: string
    total: number
  }>
  estados_inscripciones: Array<{
    estado: string
    total: number
  }>
  evaluaciones_pendientes: number
  evaluaciones_completadas: number
}

export interface ReporteInscripcion {
  id: number
  olimpista_nombre: string
  olimpista_documento: string
  area_nombre: string
  nivel_nombre: string
  departamento_nombre: string
  unidad_educativa_nombre: string
  estado: string
  created_at: string
}

export interface ReporteEvaluacion {
  id: number
  olimpista_nombre: string
  olimpista_documento: string
  area_nombre: string
  nivel_nombre: string
  evaluador_nombre: string
  puntuacion: number
  fecha_evaluacion: string
  observaciones?: string
}

export interface ReporteResultado {
  posicion: number
  olimpista_nombre: string
  olimpista_documento: string
  area_nombre: string
  nivel_nombre: string
  departamento_nombre: string
  unidad_educativa_nombre: string
  medalla: string
  puntuacion_final: number
  fecha_resultado: string
}

export interface MedalleroCompleto {
  area: string
  nivel: string
  medalla: string
  cantidad: number
}

export interface RankingPorArea {
  posicion: number
  olimpista_nombre: string
  olimpista_documento: string
  area_nombre: string
  nivel_nombre: string
  departamento_nombre: string
  unidad_educativa_nombre: string
  medalla: string
  puntuacion_final: number
}

export interface EstadisticasPorDepartamento {
  total_por_departamento: Array<{
    departamento: string
    total: number
  }>
  clasificados_por_departamento: Array<{
    departamento: string
    clasificados: number
  }>
  premiados_por_departamento: Array<{
    departamento: string
    premiados: number
  }>
  medallas_por_departamento: Array<{
    departamento: string
    medalla: string
    cantidad: number
  }>
}

export interface EstadisticasPorArea {
  inscripciones_por_area: Array<{
    area: string
    total: number
  }>
  clasificados_por_area: Array<{
    area: string
    clasificados: number
  }>
  premiados_por_area: Array<{
    area: string
    premiados: number
  }>
  medallas_por_area: Array<{
    area: string
    medalla: string
    cantidad: number
  }>
  promedio_puntuaciones_por_area: Array<{
    area: string
    promedio_puntuacion: number
  }>
}

export interface ReporteDetalladoOlimpista {
  olimpista: any
  inscripciones: any[]
  evaluaciones_clasificacion: any[]
  evaluaciones_finales: any[]
  resultados: any[]
}

export interface ReporteEvaluador {
  evaluaciones_clasificacion: any[]
  evaluaciones_finales: any[]
  estadisticas: {
    total_evaluaciones: number
    promedio_puntuaciones: number
  }
}


export interface FiltrosInscripciones {
  area_id?: number
  nivel_id?: number
  departamento_id?: number
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface FiltrosEvaluaciones {
  area_id?: number
  nivel_id?: number
  evaluador_id?: number
  fase?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface FiltrosResultados {
  area_id?: number
  nivel_id?: number
  fase?: string
  medalla?: string
}

export interface FiltrosMedallero {
  area_id?: number
  nivel_id?: number
}

export const useEstadisticasGenerales = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEstadisticas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getEstadisticasGenerales()
      if (response.success && response.data) {
        setEstadisticas(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar estadísticas')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas')
      setEstadisticas(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEstadisticas()
  }, [fetchEstadisticas])

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas,
  }
}


export const useReporteInscripciones = (filters?: FiltrosInscripciones) => {
  const [inscripciones, setInscripciones] = useState<ReporteInscripcion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInscripciones = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getReporteInscripciones(filters)
      if (response.success && response.data) {
        setInscripciones(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar inscripciones')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar inscripciones')
      setInscripciones([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchInscripciones()
  }, [fetchInscripciones])

  return {
    inscripciones,
    loading,
    error,
    refetch: fetchInscripciones,
  }
}


export const useReporteEvaluaciones = (filters?: FiltrosEvaluaciones) => {
  const [evaluaciones, setEvaluaciones] = useState<ReporteEvaluacion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvaluaciones = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getReporteEvaluaciones(filters)
      if (response.success && response.data) {
        setEvaluaciones(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar evaluaciones')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluaciones')
      setEvaluaciones([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchEvaluaciones()
  }, [fetchEvaluaciones])

  return {
    evaluaciones,
    loading,
    error,
    refetch: fetchEvaluaciones,
  }
}


export const useReporteResultados = (filters?: FiltrosResultados) => {
  const [resultados, setResultados] = useState<ReporteResultado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResultados = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getReporteResultados(filters)
      if (response.success && response.data) {
        setResultados(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar resultados')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar resultados')
      setResultados([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchResultados()
  }, [fetchResultados])

  return {
    resultados,
    loading,
    error,
    refetch: fetchResultados,
  }
}


export const useMedalleroCompleto = (filters?: FiltrosMedallero) => {
  const [medallero, setMedallero] = useState<MedalleroCompleto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMedallero = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getMedalleroCompleto(filters)
      if (response.success && response.data) {
        setMedallero(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar medallero')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar medallero')
      setMedallero([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchMedallero()
  }, [fetchMedallero])

  return {
    medallero,
    loading,
    error,
    refetch: fetchMedallero,
  }
}


export const useRankingPorArea = (areaId: number, nivelId?: number, fase?: string) => {
  const [ranking, setRanking] = useState<RankingPorArea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = useCallback(async () => {
    if (!areaId) return

    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getRankingPorArea(areaId, nivelId, fase)
      if (response.success && response.data) {
        setRanking(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar ranking')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar ranking')
      setRanking([])
    } finally {
      setLoading(false)
    }
  }, [areaId, nivelId, fase])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  return {
    ranking,
    loading,
    error,
    refetch: fetchRanking,
  }
}


export const useEstadisticasPorDepartamento = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPorDepartamento | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEstadisticas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getEstadisticasPorDepartamento()
      if (response.success && response.data) {
        setEstadisticas(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar estadísticas por departamento')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas por departamento')
      setEstadisticas(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEstadisticas()
  }, [fetchEstadisticas])

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas,
  }
}


export const useEstadisticasPorArea = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPorArea | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEstadisticas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getEstadisticasPorArea()
      if (response.success && response.data) {
        setEstadisticas(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar estadísticas por área')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas por área')
      setEstadisticas(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEstadisticas()
  }, [fetchEstadisticas])

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas,
  }
}


export const useReporteDetalladoOlimpista = (olimpistaId: number) => {
  const [reporte, setReporte] = useState<ReporteDetalladoOlimpista | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReporte = useCallback(async () => {
    if (!olimpistaId) return

    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getReporteDetalladoOlimpista(olimpistaId)
      if (response.success && response.data) {
        setReporte(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar reporte del olimpista')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar reporte del olimpista')
      setReporte(null)
    } finally {
      setLoading(false)
    }
  }, [olimpistaId])

  useEffect(() => {
    fetchReporte()
  }, [fetchReporte])

  return {
    reporte,
    loading,
    error,
    refetch: fetchReporte,
  }
}


export const useReporteEvaluador = (evaluadorId: number, filters?: {
  fecha_desde?: string
  fecha_hasta?: string
}) => {
  const [reporte, setReporte] = useState<ReporteEvaluador | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReporte = useCallback(async () => {
    if (!evaluadorId) return

    setLoading(true)
    setError(null)

    try {
      const response = await ReporteService.getReporteEvaluador(evaluadorId, filters)
      if (response.success && response.data) {
        setReporte(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar reporte del evaluador')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar reporte del evaluador')
      setReporte(null)
    } finally {
      setLoading(false)
    }
  }, [evaluadorId, filters])

  useEffect(() => {
    fetchReporte()
  }, [fetchReporte])

  return {
    reporte,
    loading,
    error,
    refetch: fetchReporte,
  }
}


export const useExportarInscripciones = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportar = async (filters?: FiltrosInscripciones) => {
    setLoading(true)
    setError(null)

    try {
      await ReporteService.exportarInscripciones(filters)
    } catch (err: any) {
      setError(err.message || 'Error al exportar inscripciones')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    exportar,
    loading,
    error,
  }
}


export const useExportarResultados = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportar = async (filters?: FiltrosResultados) => {
    setLoading(true)
    setError(null)

    try {
      await ReporteService.exportarResultados(filters)
    } catch (err: any) {
      setError(err.message || 'Error al exportar resultados')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    exportar,
    loading,
    error,
  }
}





