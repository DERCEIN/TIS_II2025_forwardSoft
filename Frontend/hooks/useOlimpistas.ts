"use client"

import { useState, useEffect, useCallback } from 'react'
import { OlimpistaService, ApiResponse } from '@/lib/api'


export interface Olimpista {
  id: number
  nombre_completo: string
  documento_identidad: string
  grado_escolaridad: string
  tutor_legal_id: number
  tutor_academico_id?: number
  unidad_educativa_id: number
  departamento_id: number
  telefono?: string
  email?: string
  fecha_inscripcion: string
  created_at: string
  updated_at: string
  is_active: boolean

  tutor_legal_nombre?: string
  tutor_legal_documento?: string
  tutor_legal_telefono?: string
  tutor_legal_email?: string
  tutor_legal_direccion?: string
  tutor_academico_nombre?: string
  tutor_academico_documento?: string
  tutor_academico_telefono?: string
  tutor_academico_email?: string
  tutor_academico_especialidad?: string
  unidad_educativa_nombre?: string
  unidad_educativa_codigo?: string
  departamento_nombre?: string
  departamento_codigo?: string
  inscripciones?: Inscripcion[]
}

export interface Inscripcion {
  id: number
  olimpista_id: number
  area_competencia_id: number
  nivel_competencia_id: number
  es_grupo: boolean
  nombre_grupo?: string
  integrantes_grupo?: string
  estado: 'inscrito' | 'clasificado' | 'premiado'
  created_at: string
  updated_at: string
  area_nombre?: string
  nivel_nombre?: string
}

export interface OlimpistaFilters {
  search?: string
  area_id?: number
  nivel_id?: number
  departamento_id?: number
  estado?: string
}


export const useOlimpistas = (filters?: OlimpistaFilters) => {
  const [olimpistas, setOlimpistas] = useState<Olimpista[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOlimpistas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await OlimpistaService.getAll(filters)
      if (response.success && response.data) {
        setOlimpistas(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar olimpistas')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar olimpistas')
      setOlimpistas([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOlimpistas()
  }, [fetchOlimpistas])

  return {
    olimpistas,
    loading,
    error,
    refetch: fetchOlimpistas,
  }
}


export const useOlimpista = (id: number) => {
  const [olimpista, setOlimpista] = useState<Olimpista | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOlimpista = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await OlimpistaService.getById(id)
      if (response.success && response.data) {
        setOlimpista(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar olimpista')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar olimpista')
      setOlimpista(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOlimpista()
  }, [fetchOlimpista])

  return {
    olimpista,
    loading,
    error,
    refetch: fetchOlimpista,
  }
}


export const useOlimpistasByArea = (areaId: number, nivelId?: number) => {
  const [olimpistas, setOlimpistas] = useState<Olimpista[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOlimpistas = useCallback(async () => {
    if (!areaId) return

    setLoading(true)
    setError(null)

    try {
      const response = await OlimpistaService.getByArea(areaId, nivelId)
      if (response.success && response.data) {
        setOlimpistas(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar olimpistas del área')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar olimpistas del área')
      setOlimpistas([])
    } finally {
      setLoading(false)
    }
  }, [areaId, nivelId])

  useEffect(() => {
    fetchOlimpistas()
  }, [fetchOlimpistas])

  return {
    olimpistas,
    loading,
    error,
    refetch: fetchOlimpistas,
  }
}


export const useOlimpistasByLevel = (nivelId: number) => {
  const [olimpistas, setOlimpistas] = useState<Olimpista[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOlimpistas = useCallback(async () => {
    if (!nivelId) return

    setLoading(true)
    setError(null)

    try {
      const response = await OlimpistaService.getByLevel(nivelId)
      if (response.success && response.data) {
        setOlimpistas(response.data)
      } else {
        throw new Error(response.message || 'Error al cargar olimpistas del nivel')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar olimpistas del nivel')
      setOlimpistas([])
    } finally {
      setLoading(false)
    }
  }, [nivelId])

  useEffect(() => {
    fetchOlimpistas()
  }, [fetchOlimpistas])

  return {
    olimpistas,
    loading,
    error,
    refetch: fetchOlimpistas,
  }
}


export const useCreateOlimpista = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOlimpista = async (data: Partial<Olimpista>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await OlimpistaService.create(data)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Error al crear olimpista')
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear olimpista')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createOlimpista,
    loading,
    error,
  }
}


export const useUpdateOlimpista = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateOlimpista = async (id: number, data: Partial<Olimpista>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await OlimpistaService.update(id, data)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Error al actualizar olimpista')
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar olimpista')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    updateOlimpista,
    loading,
    error,
  }
}


export const useDeleteOlimpista = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteOlimpista = async (id: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await OlimpistaService.delete(id)
      if (response.success) {
        return true
      } else {
        throw new Error(response.message || 'Error al eliminar olimpista')
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar olimpista')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteOlimpista,
    loading,
    error,
  }
}
