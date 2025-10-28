"use client"

import { useState, useEffect, useCallback } from 'react'
import { EvaluacionService, ApiResponse } from '@/lib/api'


export interface EvaluacionClasificacion {
  id: number
  inscripcion_area_id: number
  evaluador_id: number
  puntuacion: number
  observaciones?: string
  fecha_evaluacion: string
  is_final: boolean
  created_at: string
  updated_at: string
  
  olimpista_nombre?: string
  olimpista_documento?: string
  area_nombre?: string
  nivel_nombre?: string
  evaluador_nombre?: string
}

export interface EvaluacionFinal {
  id: number
  inscripcion_area_id: number
  evaluador_id: number
  puntuacion: number
  observaciones?: string
  fecha_evaluacion: string
  created_at: string
  updated_at: string
  
  olimpista_nombre?: string
  olimpista_documento?: string
  area_nombre?: string
  nivel_nombre?: string
  evaluador_nombre?: string
}

export interface ResultadoFinal {
  id: number
  inscripcion_area_id: number
  fase: 'clasificacion' | 'final'
  posicion: number
  medalla: 'oro' | 'plata' | 'bronce' | 'mencion_honor' | 'sin_medalla'
  puntuacion_final: number
  fecha_resultado: string
  created_at: string
  
  olimpista_nombre?: string
  olimpista_documento?: string
  area_nombre?: string
  nivel_nombre?: string
  departamento_nombre?: string
  unidad_educativa_nombre?: string
}


export interface EvaluacionFilters {
  area_id?: number
  nivel_id?: number
  evaluador_id?: number
  fase?: string
  fecha_desde?: string
  fecha_hasta?: string
}


export const useEvaluacionesClasificacion = (filters?: EvaluacionFilters) => {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionClasificacion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvaluaciones = useCallback(async () => {
    if (!filters?.area_id) return

    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.getEvaluacionesByArea(filters.area_id, filters.nivel_id)
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


export const useEvaluacionesFinales = (filters?: EvaluacionFilters) => {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionFinal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvaluaciones = useCallback(async () => {
    if (!filters?.area_id) return

    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.getEvaluacionesFinalesByArea(filters.area_id, filters.nivel_id)
      if (response.success && response.data) {
        setEvaluaciones(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar evaluaciones finales')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluaciones finales')
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


export const useEvaluacionesByInscripcion = (inscripcionId: number) => {
  const [evaluaciones, setEvaluaciones] = useState<{
    clasificacion: EvaluacionClasificacion[]
    final: EvaluacionFinal[]
  }>({
    clasificacion: [],
    final: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvaluaciones = useCallback(async () => {
    if (!inscripcionId) return

    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.getEvaluacionesByInscripcion(inscripcionId)
      if (response.success && response.data) {
        setEvaluaciones(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar evaluaciones de la inscripción')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluaciones de la inscripción')
      setEvaluaciones({ clasificacion: [], final: [] })
    } finally {
      setLoading(false)
    }
  }, [inscripcionId])

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


export const useCreateEvaluacionClasificacion = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEvaluacion = async (data: {
    inscripcion_area_id: number
    puntuacion: number
    observaciones?: string
    is_final?: boolean
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.evaluarClasificacion(data)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Error al crear evaluación')
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear evaluación')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createEvaluacion,
    loading,
    error,
  }
}


export const useCreateEvaluacionFinal = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEvaluacion = async (data: {
    inscripcion_area_id: number
    puntuacion: number
    observaciones?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.evaluarFinal(data)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Error al crear evaluación final')
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear evaluación final')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createEvaluacion,
    loading,
    error,
  }
}

// Hook para calcular clasificados
export const useCalcularClasificados = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calcularClasificados = async (areaId: number, nivelId?: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.calcularClasificados(areaId, nivelId)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Error al calcular clasificados')
      }
    } catch (err: any) {
      setError(err.message || 'Error al calcular clasificados')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    calcularClasificados,
    loading,
    error,
  }
}

// Hook para calcular premiados
export const useCalcularPremiados = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calcularPremiados = async (areaId: number, nivelId?: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.calcularPremiados(areaId, nivelId)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Error al calcular premiados')
      }
    } catch (err: any) {
      setError(err.message || 'Error al calcular premiados')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    calcularPremiados,
    loading,
    error,
  }
}

// Hook para resultados finales
export const useResultadosFinales = (areaId: number, nivelId?: number, fase?: string) => {
  const [resultados, setResultados] = useState<ResultadoFinal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResultados = useCallback(async () => {
    if (!areaId) return

    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.getResultadosFinales(areaId, nivelId, fase)
      if (response.success && response.data) {
        setResultados(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar resultados finales')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar resultados finales')
      setResultados([])
    } finally {
      setLoading(false)
    }
  }, [areaId, nivelId, fase])

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

// Hook para medallero
export const useMedallero = (areaId: number, nivelId?: number) => {
  const [medallero, setMedallero] = useState<Array<{
    medalla: string
    cantidad: number
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMedallero = useCallback(async () => {
    if (!areaId) return

    setLoading(true)
    setError(null)

    try {
      const response = await EvaluacionService.getMedallero(areaId, nivelId)
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
  }, [areaId, nivelId])

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
