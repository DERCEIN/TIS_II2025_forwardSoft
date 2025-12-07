import { id } from "date-fns/locale"
import type { PublishedResult } from "@/lib/types"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')


export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  last_page: number
}


export class ApiService {
  private static token: string | null = null
  private static baseURL: string = API_BASE_URL

  
  static setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
  }

  
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return this.token
  }

  
  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()

    console.log('API Request - URL:', url)
    console.log('API Request - Method:', options.method || 'GET')
    console.log('API Request - Has Token:', token ? 'Yes' : 'No')

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      console.log('API Request - Sending request...')
      const response = await fetch(url, config)
      console.log('API Response - Status:', response.status, response.statusText)
      
      const text = await response.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        console.error('API Response - Error parsing JSON:', text)
      }

      if (!response.ok) {
        let message = (data && data.message) ? data.message : (text || 'Error en la petición')
        
        // Si hay errores de validación (422), construir mensaje más detallado
        if (response.status === 422 && data && data.errors) {
          const errores = Object.entries(data.errors)
            .map(([campo, mensajes]: [string, any]) => {
              const msgs = Array.isArray(mensajes) ? mensajes : [mensajes]
              return `${campo}: ${msgs.join(', ')}`
            })
            .join('; ')
          message = errores || message
        }
        
        console.error(' API Response - Error:', message)
        if (data && data.errors) {
          console.error('API Response - Validation Errors:', data.errors)
        }
        throw new Error(`${response.status}:${message}`)
      }

      console.log(' API Response - Success:', data)

      
      if (!data) {
        return {
          success: false,
          message: 'No se recibió respuesta del servidor',
          data: null
        } as ApiResponse<T>
      }

      return data as ApiResponse<T>
    } catch (error) {
      console.error('🌐 API Error - Exception:', error)
      throw error
    }
  }

  
  static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  static async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }


  static async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('csv_file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()

    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al subir el archivo')
      }

      return data
    } catch (error) {
      console.error('Upload Error:', error)
      throw error
    }
  }
}


export class AuthService {
  static async login(email: string, password: string, role: string) {
    return ApiService.post('/api/auth/login', { email, password, role })
  }

  static async logout() {
    return ApiService.post('/api/auth/logout')
  }

  static async getProfile() {
    return ApiService.get('/api/auth/me')
  }

  static async refreshToken() {
    return ApiService.post('/api/auth/refresh')
  }
}

// Perfil del usuario autenticado
export class ProfileService {
  static async changePassword(userId: number, data: { current_password: string; new_password: string; confirm_password: string }) {
    return ApiService.put(`/api/users/${userId}/password`, data)
  }

  static async uploadAvatar(file: File) {
    const form = new FormData()
    form.append('avatar', file)

    const url = `${API_BASE_URL}/api/users/avatar`
    const token = ApiService.getToken()
    const headers: HeadersInit = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(url, { method: 'POST', headers, body: form })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.message || 'Error al subir avatar')
    return json as ApiResponse<{ avatar_url: string; saved: boolean; warning?: string }>
  }

  static async updateProfile(userId: number, data: { name?: string; email?: string }) {
    return ApiService.put(`/api/users/${userId}`, data)
  }
}

export class OlimpistaService {
  static async getAll(filters?: {
    search?: string
    area_id?: number
    nivel_id?: number
    departamento_id?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return ApiService.get(`/api/olimpistas${queryString ? `?${queryString}` : ''}`)
  }

  static async getById(id: number) {
    return ApiService.get(`/api/olimpistas/${id}`)
  }

  static async create(data: any) {
    return ApiService.post('/api/olimpistas', data)
  }

  static async update(id: number, data: any) {
    return ApiService.put(`/api/olimpistas/${id}`, data)
  }

  static async delete(id: number) {
    return ApiService.delete(`/api/olimpistas/${id}`)
  }

  static async getByArea(areaId: number, nivelId?: number) {
    const params = nivelId ? `?nivel_id=${nivelId}` : ''
    return ApiService.get(`/api/olimpistas/area/${areaId}${params}`)
  }

  static async getByLevel(nivelId: number) {
    return ApiService.get(`/api/olimpistas/nivel/${nivelId}`)
  }
}

export class ImportService {
  static async importOlimpistas(file: File) {
    return ApiService.uploadFile('/api/import/olimpistas', file)
  }

  static async downloadTemplate() {
    const token = ApiService.getToken()
    
    const response = await fetch(`${API_BASE_URL}/api/import/template`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error al descargar la plantilla: ${response.status} - ${errorText}`)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_olimpistas_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

// Servicio para certificados y premiación
export class CertificadosService {
  // Coordinador: Obtener participantes premiados de su área
  static async getParticipantesPremiados() {
    return ApiService.get('/api/coordinador/certificados/participantes-premiados')
  }

  // Coordinador: Aprobar certificados
  static async aprobarCertificados(aprobado: boolean, observaciones?: string) {
    return ApiService.post('/api/coordinador/certificados/aprobar', {
      aprobado,
      observaciones
    })
  }

  // Admin: Obtener todas las áreas con estado de aprobación
  static async getAreasAprobadas() {
    return ApiService.get('/api/admin/certificados/areas')
  }

  // Admin: Obtener participantes premiados por área
  static async getParticipantesPremiadosPorArea(areaId: number) {
    return ApiService.get(`/api/admin/certificados/participantes-premiados/${areaId}`)
  }
}

export class EvaluacionService {
  static async evaluarClasificacion(data: {
    inscripcion_area_id: number
    puntuacion: number
    observaciones?: string
    is_final?: boolean
  }) {
    return ApiService.post('/api/evaluaciones/clasificacion', data)
  }

  static async evaluarFinal(data: {
    inscripcion_area_id: number
    puntuacion: number
    observaciones?: string
  }) {
    return ApiService.post('/api/evaluaciones/final', data)
  }

  static async getEvaluacionesByArea(areaId: number, nivelId?: number) {
    const params = nivelId ? `?nivel_id=${nivelId}` : ''
    return ApiService.get(`/api/evaluaciones/area/${areaId}${params}`)
  }

  static async getEvaluacionesFinalesByArea(areaId: number, nivelId?: number) {
    const params = nivelId ? `?nivel_id=${nivelId}` : ''
    return ApiService.get(`/api/evaluaciones/finales/area/${areaId}${params}`)
  }

  static async getEvaluacionesByInscripcion(inscripcionId: number) {
    return ApiService.get(`/api/evaluaciones/inscripcion/${inscripcionId}`)
  }

  static async calcularClasificados(areaId: number, nivelId?: number) {
    const params = nivelId ? `?nivel_id=${nivelId}` : ''
    return ApiService.post(`/api/evaluaciones/calcular-clasificados/${areaId}${params}`)
  }

  static async calcularPremiados(areaId: number, nivelId?: number) {
    const params = nivelId ? `?nivel_id=${nivelId}` : ''
    return ApiService.post(`/api/evaluaciones/calcular-premiados/${areaId}${params}`)
  }

  static async getResultadosFinales(areaId: number, nivelId?: number, fase?: string) {
    const params = new URLSearchParams()
    if (nivelId) params.append('nivel_id', nivelId.toString())
    if (fase) params.append('fase', fase)
    
    const queryString = params.toString()
    return ApiService.get(`/api/evaluaciones/resultados/${areaId}${queryString ? `?${queryString}` : ''}`)
  }

  static async getMedallero(areaId: number, nivelId?: number) {
    const params = nivelId ? `?nivel_id=${nivelId}` : ''
    return ApiService.get(`/api/evaluaciones/medallero/${areaId}${params}`)
  }

  static async confirmarCierreCalificacion(data: {
    area_id: number
    nivel_id: number
    fase?: string
  }) {
    return ApiService.post('/api/evaluador/confirmar-cierre-calificacion', data)
  }
}

export class ReporteService {
  static async getEstadisticasGenerales() {
    return ApiService.get('/api/reportes/estadisticas')
  }

  static async getReporteInscripciones(filters?: {
    area_id?: number
    nivel_id?: number
    departamento_id?: number
    estado?: string
    fecha_desde?: string
    fecha_hasta?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return ApiService.get(`/api/reportes/inscripciones${queryString ? `?${queryString}` : ''}`)
  }

  static async getReporteEvaluaciones(filters?: {
    area_id?: number
    nivel_id?: number
    evaluador_id?: number
    fase?: string
    fecha_desde?: string
    fecha_hasta?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return ApiService.get(`/api/reportes/evaluaciones${queryString ? `?${queryString}` : ''}`)
  }

  static async getReporteResultados(filters?: {
    area_id?: number
    nivel_id?: number
    fase?: string
    medalla?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return ApiService.get(`/api/reportes/resultados${queryString ? `?${queryString}` : ''}`)
  }

  static async getMedalleroCompleto(filters?: {
    area_id?: number
    nivel_id?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return ApiService.get(`/api/reportes/medallero-completo${queryString ? `?${queryString}` : ''}`)
  }

  static async getRankingPorArea(areaId: number, nivelId?: number, fase?: string) {
    const params = new URLSearchParams()
    if (nivelId) params.append('nivel_id', nivelId.toString())
    if (fase) params.append('fase', fase)
    
    const queryString = params.toString()
    return ApiService.get(`/api/reportes/ranking/${areaId}${queryString ? `?${queryString}` : ''}`)
  }

  static async getEstadisticasPorDepartamento() {
    return ApiService.get('/api/reportes/estadisticas-departamento')
  }

  static async getEstadisticasPorArea() {
    return ApiService.get('/api/reportes/estadisticas-area')
  }

  static async getReporteDetalladoOlimpista(olimpistaId: number) {
    return ApiService.get(`/api/reportes/olimpista/${olimpistaId}`)
  }

  static async getReporteEvaluador(evaluadorId: number, filters?: {
    fecha_desde?: string
    fecha_hasta?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return ApiService.get(`/api/reportes/evaluador/${evaluadorId}${queryString ? `?${queryString}` : ''}`)
  }

  static async exportarInscripciones(filters?: {
    area_id?: number
    nivel_id?: number
    departamento_id?: number
    estado?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    const response = await fetch(`${API_BASE_URL}/api/reportes/exportar/inscripciones${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${ApiService.getToken()}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Error al exportar inscripciones')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscripciones_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  static async exportarResultados(filters?: {
    area_id?: number
    nivel_id?: number
    fase?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    const response = await fetch(`${API_BASE_URL}/api/reportes/exportar/resultados${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${ApiService.getToken()}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Error al exportar resultados')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resultados_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export class AdminService {
  static async getDashboard() {
    return ApiService.get('/api/admin/dashboard')
  }

  static async getUsers() {
    return ApiService.get('/api/admin/users')
  }

  static async createUser(data: {
    name: string
    email: string
    role: string
    area_id?: number
  }) {
    return ApiService.post('/api/admin/users', data)
  }

  static async reenviarCredenciales(userId: number) {
    return ApiService.post(`/api/admin/users/${userId}/resend-credentials`)
  }

  static async importUsers(file: File) {
    return ApiService.uploadFile('/api/admin/users/import', file)
  }

  static async getDashboardCierreFase() {
    return ApiService.get('/api/admin/cierre-fase/dashboard')
  }

  static async extenderFechaCierre(data: {
    nueva_fecha: string
    justificacion: string
  }) {
    return ApiService.post('/api/admin/cierre-fase/extender-fecha', data)
  }

  static async cerrarFaseGeneral(data: {
    confirmado: boolean
  }) {
    return ApiService.post('/api/admin/cierre-fase/cerrar-general', data)
  }

  static async revertirCierreFase(data: {
    confirmado: boolean
    justificacion: string
  }) {
    return ApiService.post('/api/admin/cierre-fase/revertir', data)
  }
}

export class CoordinadorService {
  static async getDashboard() {
    return ApiService.get('/api/coordinador/dashboard')
  }

  static async getAreaData(areaId: number) {
    return ApiService.get(`/api/coordinador/area/${areaId}`)
  }

  static async getCatalogos() {
    return ApiService.get('/api/coordinador/catalogos')
  }

  static async generarAsignaciones(params: {
    area_id: number
    nivel_id?: number | string
    ronda_id?: number
    fase: 'clasificacion' | 'final'
    num_evaluadores: number
    metodo: 'simple' | 'balanceado'
    evitar_misma_institucion?: boolean
    evitar_misma_area?: boolean
    confirmar?: boolean
  }) {
    return ApiService.post('/api/coordinador/asignaciones/generar', params)
  }

  static async listarAsignacionesPorArea(areaId: number, filters?: { nivel_id?: number; fase?: 'clasificacion' | 'final' }) {
    const params = new URLSearchParams()
    if (filters?.nivel_id) params.append('nivel_id', String(filters.nivel_id))
    if (filters?.fase) params.append('fase', filters.fase)
    const qs = params.toString()
    return ApiService.get(`/api/coordinador/asignaciones/area/${areaId}${qs ? `?${qs}` : ''}`)
  }

  static async exportarAsignaciones(areaId: number, filters?: { nivel_id?: number; fase?: 'clasificacion' | 'final' }) {
    const params = new URLSearchParams()
    if (filters?.nivel_id) params.append('nivel_id', String(filters.nivel_id))
    if (filters?.fase) params.append('fase', filters.fase)
    const qs = params.toString()
    
    const response = await fetch(`${API_BASE_URL}/api/coordinador/asignaciones/exportar/${areaId}${qs ? `?${qs}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${ApiService.getToken()}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Error al exportar asignaciones')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asignaciones_${areaId}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  static async crearRonda(data: {
    nombre: string
    descripcion?: string
    area_id?: number
    nivel_id?: number
    fecha_inicio?: string
    fecha_fin?: string
  }) {
    return ApiService.post('/api/coordinador/rondas', data)
  }

  static async cerrarCalificacion(data: {
    area_id: number
    nivel_id: number
    fase?: 'clasificacion' | 'final'
  }) {
    return ApiService.post('/api/coordinador/cerrar-calificacion', data)
  }

  static async getParticipantesConEvaluaciones(filters?: {
    area_id?: number
    nivel_id?: number
    fase?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.area_id) params.append('area_id', String(filters.area_id))
    if (filters?.nivel_id) params.append('nivel_id', String(filters.nivel_id))
    if (filters?.fase) params.append('fase', filters.fase)
    const qs = params.toString()
    return ApiService.get(`/api/coordinador/participantes-evaluaciones${qs ? `?${qs}` : ''}`)
  }

  static async getListasClasificacion(filters?: {
    area_id?: number
    nivel_id?: number
    fase?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.area_id) params.append('area_id', String(filters.area_id))
    if (filters?.nivel_id) params.append('nivel_id', String(filters.nivel_id))
    if (filters?.fase) params.append('fase', filters.fase)
    const qs = params.toString()
    return ApiService.get(`/api/coordinador/listas-clasificacion${qs ? `?${qs}` : ''}`)
  }

  static async getLogCambiosNotas(filters?: {
    area_id: number
    nivel_id?: number
    fecha_desde?: string
    fecha_hasta?: string
    evaluador_id?: number
    olimpista_id?: number
    estado_aprobacion?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.area_id) params.append('area_id', String(filters.area_id))
    if (filters?.nivel_id) params.append('nivel_id', String(filters.nivel_id))
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
    if (filters?.evaluador_id) params.append('evaluador_id', String(filters.evaluador_id))
    if (filters?.olimpista_id) params.append('olimpista_id', String(filters.olimpista_id))
    if (filters?.estado_aprobacion) params.append('estado_aprobacion', filters.estado_aprobacion)
    
    const qs = params.toString()
    return ApiService.get(`/api/coordinador/log-cambios-notas${qs ? `?${qs}` : ''}`)
  }

  static async getCambiosPendientes() {
    return ApiService.get('/api/coordinador/cambios-pendientes')
  }

  static async aprobarCambio(cambioId: number, observaciones?: string) {
    return ApiService.post(`/api/coordinador/log-cambios-notas/${cambioId}/aprobar`, {
      observaciones
    })
  }

  static async rechazarCambio(cambioId: number, observaciones?: string) {
    return ApiService.post(`/api/coordinador/log-cambios-notas/${cambioId}/rechazar`, {
      observaciones
    })
  }

  static async solicitarMasInfo(cambioId: number, observaciones: string) {
    return ApiService.post(`/api/coordinador/log-cambios-notas/${cambioId}/solicitar-info`, {
      observaciones
    })
  }

  static async getEvaluadoresPorArea(areaId: number) {
    return ApiService.get(`/api/coordinador/evaluadores-por-area?area_id=${areaId}`)
  }

  static async getProgresoEvaluacion() {
    return ApiService.get('/api/coordinador/progreso-evaluacion')
  }

  static async getProgresoEvaluacionFinal() {
    return ApiService.get('/api/coordinador/progreso-evaluacion-final')
  }

  static async getAlertasCriticas() {
    return ApiService.get('/api/coordinador/alertas-criticas')
  }

  static async getDashboardCierreFase() {
    return ApiService.get('/api/coordinador/cierre-fase/dashboard')
  }

  static async cerrarFaseArea() {
    return ApiService.post('/api/coordinador/cierre-fase/cerrar', {})
  }

  static async cerrarFaseFinal() {
    return ApiService.post('/api/coordinador/cierre-fase-final/cerrar', {})
  }

  static async descargarReportePDF() {
    
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    // Usar API_BASE_URL que ya normaliza las barras finales
    const apiUrl = API_BASE_URL
    
    if (!token) {
      console.error(' No se encontró token de autenticación')
      console.error('   - auth_token:', typeof window !== 'undefined' ? localStorage.getItem('auth_token') : 'N/A')
      console.error('   - token:', typeof window !== 'undefined' ? localStorage.getItem('token') : 'N/A')
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    console.log('Token encontrado para descargar PDF')
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/cierre-fase/descargar-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      
      const contentType = response.headers.get('content-type') || ''
      
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'No se encontró el PDF. Asegúrate de que la fase esté cerrada.'
        throw new Error(errorMessage)
      }

      
      if (!response.ok) {
        
        const clonedResponse = response.clone()
        try {
          const errorData = await clonedResponse.json()
          throw new Error(errorData.message || errorData.error || 'Error al descargar el PDF')
        } catch (e) {
          
          throw new Error('Error al descargar el PDF. Asegúrate de que la fase esté cerrada.')
        }
      }

      // Verificar que sea PDF
      if (!contentType.includes('application/pdf')) {
        throw new Error('La respuesta no es un PDF válido')
      }

      const blob = await response.blob()
      
      // Verificar que el blob sea un PDF válido (tamaño razonable)
      if (blob.size < 100) {
        // Puede ser un error JSON que se leyó como blob
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el PDF')
        } catch (e) {
          throw new Error('El archivo PDF está vacío o no se encontró. Asegúrate de que la fase esté cerrada.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_cierre_fase_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando PDF:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el PDF' }
    }
  }

  static async listarReportesPDF() {
    return ApiService.get('/api/coordinador/cierre-fase/listar-pdfs')
  }

  static async guardarFirma(firmaImagen: string, reporteTipo: string = 'cierre_fase') {
    return ApiService.post('/api/coordinador/firma/guardar', {
      firma_imagen: firmaImagen,
      reporte_tipo: reporteTipo
    })
  }

  static async obtenerFirma(reporteTipo: string = 'cierre_fase') {
    return ApiService.get(`/api/coordinador/firma/obtener?reporte_tipo=${reporteTipo}`)
  }

  static async descargarReportePDFEstadisticasDetalladas() {
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    // Usar API_BASE_URL que ya normaliza las barras finales
    const apiUrl = API_BASE_URL
    
    if (!token) {
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/cierre-fase/descargar-estadisticas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Error al descargar el PDF'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        throw new Error('Error al descargar el PDF')
      }

      const blob = await response.blob()
      
      if (blob.size < 100) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el PDF')
        } catch (e) {
          throw new Error('El archivo PDF está vacío o no se encontró.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_estadisticas_detalladas_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando PDF de estadísticas detalladas:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el PDF' }
    }
  }

  static async descargarReporteExcelClasificados() {
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    // Usar API_BASE_URL que ya normaliza las barras finales
    const apiUrl = API_BASE_URL
    
    if (!token) {
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/cierre-fase/descargar-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Error al descargar el Excel'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        throw new Error('Error al descargar el Excel')
      }

      const blob = await response.blob()
      
      if (blob.size < 100) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el Excel')
        } catch (e) {
          throw new Error('El archivo Excel está vacío o no se encontró.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_clasificados_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando Excel de clasificados:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el Excel' }
    }
  }

  static async descargarReportePDFProgreso() {
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    // Usar API_BASE_URL que ya normaliza las barras finales
    const apiUrl = API_BASE_URL
    
    if (!token) {
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/progreso-evaluacion/reporte-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Error al descargar el PDF'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        throw new Error('Error al descargar el PDF')
      }

      const blob = await response.blob()
      
      if (blob.size < 100) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el PDF')
        } catch (e) {
          throw new Error('El archivo PDF está vacío o no se encontró.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_progreso_evaluacion_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando PDF de progreso:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el PDF' }
    }
  }

  static async descargarReporteExcelProgreso() {
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    // Usar API_BASE_URL que ya normaliza las barras finales
    const apiUrl = API_BASE_URL
    
    if (!token) {
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/progreso-evaluacion/reporte-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Error al descargar el Excel'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        throw new Error('Error al descargar el Excel')
      }

      const blob = await response.blob()
      
      if (blob.size < 100) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el archivo')
        } catch (e) {
          throw new Error('El archivo Excel está vacío o no se encontró.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_progreso_evaluacion_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando Excel de progreso:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el Excel' }
    }
  }

  static async descargarReportePDFCierreFaseFinal() {
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    const apiUrl = API_BASE_URL
    
    if (!token) {
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/cierre-fase-final/reporte-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'No se encontró el PDF. Asegúrate de que la fase final esté cerrada.'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        throw new Error('Error al descargar el PDF')
      }

      const blob = await response.blob()
      
      if (blob.size < 100) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el PDF')
        } catch (e) {
          throw new Error('El archivo PDF está vacío o no se encontró. Asegúrate de que la fase final esté cerrada.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_cierre_fase_final_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando PDF de fase final:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el PDF' }
    }
  }

  static async descargarReporteExcelParticipantesFaseFinal() {
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    const apiUrl = API_BASE_URL
    
    if (!token) {
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/cierre-fase-final/reporte-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Error al descargar el Excel'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        throw new Error('Error al descargar el Excel')
      }

      const blob = await response.blob()
      
      if (blob.size < 100) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el Excel')
        } catch (e) {
          throw new Error('El archivo Excel está vacío o no se encontró.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_participantes_fase_final_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando Excel de fase final:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el Excel' }
    }
  }

  static async descargarReportePDFEstadisticasFaseFinal() {
    const token = ApiService.getToken() || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ||
                  (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    const apiUrl = API_BASE_URL
    
    if (!token) {
      return { 
        success: false, 
        error: 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.' 
      }
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/coordinador/cierre-fase-final/reporte-estadisticas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Error al descargar el PDF'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        throw new Error('Error al descargar el PDF')
      }

      const blob = await response.blob()
      
      if (blob.size < 100) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || errorData.error || 'No se encontró el PDF')
        } catch (e) {
          throw new Error('El archivo PDF está vacío o no se encontró.')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_estadisticas_fase_final_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error: any) {
      console.error('Error descargando PDF de estadísticas fase final:', error)
      return { success: false, error: error.message || 'Error desconocido al descargar el PDF' }
    }
  }
}

export class CatalogoService {
  static async getNiveles() {
    return ApiService.get('/api/catalogo/niveles')
  }

  static async areasCompetencia() {
    return ApiService.get('/api/catalogo/areas-competencia')
  }

  static async areasCompetenciaConEstadisticas() {
    return ApiService.get('/api/catalogo/areas-competencia-estadisticas')
  }
}

export class EvaluadorService {
  static async getDashboard() {
    return ApiService.get('/api/evaluador/dashboard')
  }

  static async getEvaluaciones(fase?: 'clasificacion' | 'final') {
    const params = new URLSearchParams()
    if (fase) {
      
      params.append('fase', fase)
    }
    const queryString = params.toString()
    return ApiService.get(`/api/evaluador/evaluaciones${queryString ? `?${queryString}` : ''}`)
  }

  static async getEstadisticas() {
    return ApiService.get('/api/evaluador/estadisticas')
  }

  static async verificarPermisos() {
    return ApiService.get('/api/evaluador/verificar-permisos')
  }
}

export class ConfiguracionService {
  static async getConfiguracion() {
    return ApiService.get('/api/configuracion')
  }

  static async updateConfiguracionGeneral(data: any) {
    return ApiService.put('/api/configuracion/general', data)
  }

  static async getConfiguracionesPorArea() {
    return ApiService.get('/api/configuracion/areas')
  }

  static async getCronogramaPublico() {
    return ApiService.get('/api/public/cronograma')
  }

  static async getContactosPublico() {
    return ApiService.get('/api/public/contactos')
  }

  static async getConfiguracionPorArea(areaId: number) {
    return ApiService.get(`/api/configuracion/area?area_id=${areaId}`)
  }

  static async updateConfiguracionPorArea(data: {
    area_competencia_id: number
    tiempo_evaluacion_minutos?: number
    periodo_evaluacion_inicio?: string
    periodo_evaluacion_fin?: string
    periodo_publicacion_inicio?: string
    periodo_publicacion_fin?: string
    tiempo_evaluacion_final_minutos?: number
    periodo_evaluacion_final_inicio?: string
    periodo_evaluacion_final_fin?: string
    periodo_publicacion_final_inicio?: string
    periodo_publicacion_final_fin?: string
  }) {
    return ApiService.put('/api/configuracion/area', data)
  }

  static async validarChoquesHorarios(areaIds: number[]) {
    return ApiService.post('/api/configuracion/validar-choques', { area_ids: areaIds })
  }
}

export class DesclasificacionService {
  static async getReglasPorArea(areaId: number) {
    return ApiService.get(`/api/desclasificacion/reglas?area_id=${areaId}`)
  }

  static async registrarDesclasificacion(data: {
    inscripcion_area_id: number
    regla_desclasificacion_id: number
    motivo: string
  }) {
    return ApiService.post('/api/desclasificacion/registrar', data)
  }

  static async getDesclasificacionesPorArea(areaId: number, filtros?: {
    tipo?: string
    nivel_id?: number
    departamento_id?: number
  }) {
    const params = new URLSearchParams({ area_id: areaId.toString() })
    if (filtros?.tipo) params.append('tipo', filtros.tipo)
    if (filtros?.nivel_id) params.append('nivel_id', filtros.nivel_id.toString())
    if (filtros?.departamento_id) params.append('departamento_id', filtros.departamento_id.toString())
    
    return ApiService.get(`/api/desclasificacion/area?${params.toString()}`)
  }

  static async revocarDesclasificacion(id: number, motivoRevocacion?: string) {
    return ApiService.post('/api/desclasificacion/revocar', {
      id,
      motivo_revocacion: motivoRevocacion
    })
  }

  static async verificarDesclasificacionAutomatica(areaId: number, puntuacion: number) {
    return ApiService.post('/api/desclasificacion/verificar-automatica', {
      area_id: areaId,
      puntuacion
    })
  }

  static async getEstadisticas(areaId: number) {
    return ApiService.get(`/api/desclasificacion/estadisticas?area_id=${areaId}`)
  }
}
export class MedalleroService{
  static async getMedallero(){
    return ApiService.get('/api/administrador/medallero')
  }
  static async getAreas(){
    return ApiService.get('/api/administrador/medallero/areas')
  }
  static async updateMedallero(data: any) {
    return ApiService.put('/api/administrador/medallero', data);
  }
}

export class PublicResultsService {
  static async getMedalleroFinal(): Promise<ApiResponse<PublishedResult>> {
    return ApiService.get<PublishedResult>("/api/administrador/medallero/final")
  }
}

export class PublicacionResultadosService {
  static async getAreasPublicadas() {
    return ApiService.get('/api/publicacion-resultados/areas')
  }

  static async getResultadosPublicados(filtros: {
    area_id: number
    nivel_id?: number
    departamento_id?: number
  }) {
    const params = new URLSearchParams({ area_id: filtros.area_id.toString() })
    if (filtros.nivel_id) params.append('nivel_id', filtros.nivel_id.toString())
    if (filtros.departamento_id) params.append('departamento_id', filtros.departamento_id.toString())
    
    return ApiService.get(`/api/publicacion-resultados/resultados?${params.toString()}`)
  }

  static async publicarResultados(data: {
    area_competencia_id: number
    observaciones?: string
  }) {
    return ApiService.post('/api/publicacion-resultados/publicar', data)
  }

  static async despublicarResultados(data: {
    area_competencia_id: number
    observaciones?: string
  }) {
    return ApiService.post('/api/publicacion-resultados/despublicar', data)
  }

  static async getEstadoPublicacion(areaId: number) {
    return ApiService.get(`/api/publicacion-resultados/estado/${areaId}`)
  }
}

interface NuevoTiempoEvaluador {
  coordinador_id: number
  evaluador_id: number
  start_date: string  // YYYY-MM-DD
  start_time: string   // HH:mm
  duration_days: number
  status: string
}



export class CoordinadorAccionService {
  static async getTiemposEvaluadoresPorArea(areaId: number) {
    try {
      if (!areaId || isNaN(areaId)) {
        console.error("ID de área inválido:", areaId)
        return []
      }
      const res = await ApiService.get(`/api/coordinador/tiempos-evaluadores-por-area?area_id=${areaId}`)

      if (!res.success || !res.data) {
        console.warn("⚠️ No se encontraron datos de evaluadores para el área", areaId)
        return []
      }

      const evaluadores = res.data.evaluadores || []

      return evaluadores.map((e: any) => ({
        id: Number(e.id),
        name: e.name,
        email: e.email,
        area: e.area_nombre,
        status: e.status || "sin-permiso",
        levels: [],
        startDate: e.start_date || null,
        startTime: e.start_time || null,
        durationDays: e.duration_days || null,
      }))
    } catch (error) {
      console.error("Error al obtener tiempos de evaluadores por área:", error)
      return []
    }
  }

  static async postTiemposEvaluadores( tiempo: NuevoTiempoEvaluador) {
    return ApiService.post(`/api/coordinador/tiempos-evaluadores`, {tiempo})
  }
  static async putTiemposEvaluadores(tiempo: NuevoTiempoEvaluador) {
    return ApiService.put(`/api/coordinador/tiempos-evaluadores/${tiempo}`)
  }
  static async deleteTiemposEvaluadores(tiempoId: number) {
    return ApiService.delete(`/api/coordinador/tiempos-evaluadores/${tiempoId}`)
  }
}
