"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/login'
}) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        
        switch (user.role) {
          case 'admin':
            router.push('/admin/dashboard')
            break
          case 'coordinador':
            router.push('/coordinador/dashboard')
            break
          case 'evaluador':
            router.push('/evaluador/dashboard')
            break
          default:
            router.push('/')
        }
        return
      }
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}


export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
)

export const CoordinadorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['coordinador']}>
    {children}
  </ProtectedRoute>
)

export const EvaluadorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['evaluador']}>
    {children}
  </ProtectedRoute>
)

export const AdminOrCoordinadorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'coordinador']}>
    {children}
  </ProtectedRoute>
)

export const AdminOrEvaluadorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'evaluador']}>
    {children}
  </ProtectedRoute>
)
