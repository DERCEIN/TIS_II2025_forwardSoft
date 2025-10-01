"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthService, ApiService } from '@/lib/api'

// Tipos de usuario
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'coordinador' | 'evaluador'
  area_id?: number
  area_name?: string
  created_at: string
  updated_at: string
}

// Estado de autenticación
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Acciones de autenticación
interface AuthActions {
  login: (email: string, password: string, role: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  clearError: () => void
}

// Contexto completo
type AuthContextType = AuthState & AuthActions

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

// Props del provider
interface AuthProviderProps {
  children: ReactNode
}

// Provider del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // Inicializar autenticación al cargar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = ApiService.getToken()
        if (token) {
          ApiService.setToken(token)
          const response = await AuthService.getProfile()
          if (response.success && response.data) {
            setState(prev => ({
              ...prev,
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
            }))
          } else {
            // Token inválido, limpiar
            ApiService.setToken(null)
            setState(prev => ({
              ...prev,
              isLoading: false,
            }))
          }
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }))
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error)
        ApiService.setToken(null)
        setState(prev => ({
          ...prev,
          isLoading: false,
        }))
      }
    }

    initAuth()
  }, [])

  // Función de login
  const login = async (email: string, password: string, role: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await AuthService.login(email, password, role)
      
      if (response.success) {
        const { user, token } = response.data
        
        // Guardar token
        ApiService.setToken(token)
        
        setState(prev => ({
          ...prev,
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }))
      } else {
        throw new Error(response.message || 'Error al iniciar sesión')
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error al iniciar sesión',
      }))
      throw error
    }
  }

  // Función de logout
  const logout = async () => {
    try {
      await AuthService.logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      // Limpiar estado local
      ApiService.setToken(null)
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  }

  // Refrescar datos del usuario
  const refreshUser = async () => {
    if (!state.isAuthenticated) return

    try {
      const response = await AuthService.getProfile()
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data,
        }))
      }
    } catch (error) {
      console.error('Error al refrescar usuario:', error)
      // Si hay error al refrescar, hacer logout
      logout()
    }
  }

  // Limpiar errores
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  // Valor del contexto
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    clearError,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para verificar roles
export const useRole = (allowedRoles: string[]) => {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated || !user) {
    return false
  }
  
  return allowedRoles.includes(user.role)
}

// Hook para verificar si es admin
export const useIsAdmin = () => {
  return useRole(['admin'])
}

// Hook para verificar si es coordinador
export const useIsCoordinador = () => {
  return useRole(['coordinador'])
}

// Hook para verificar si es evaluador
export const useIsEvaluador = () => {
  return useRole(['evaluador'])
}

// Hook para obtener el área del usuario
export const useUserArea = () => {
  const { user } = useAuth()
  return user?.area_id
}

// Hook para obtener el nombre del área del usuario
export const useUserAreaName = () => {
  const { user } = useAuth()
  return user?.area_name
}




