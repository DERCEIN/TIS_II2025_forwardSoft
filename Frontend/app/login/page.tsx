"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, isLoading, isAuthenticated, user, error: authError, clearError } = useAuth()
  const router = useRouter()

  
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Usuario autenticado, redirigiendo según rol:", user.role)
      switch (user.role) {
        case "admin":
          router.push("/admin/dashboard")
          break
        case "coordinador":
          router.push("/coordinador/dashboard")
          break
        case "evaluador":
          router.push("/evaluador/dashboard")
          break
        default:
          router.push("/")
      }
    }
  }, [isAuthenticated, user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Botón presionado, iniciando login...")
    setError("")
    clearError()

    if (!username || !password) {
      setError("Por favor ingrese usuario y contraseña")
      return
    }

    try {
      console.log("Intentando login con:", username)
      
      await login(username, password, "")
      console.log("Login exitoso")
    } catch (err: any) {
      console.error("Error en login:", err)
      setError(err.message || "Error al iniciar sesión")
    }
  }

  return (
    <div className="min-h-screen" style={{background: "linear-gradient(180deg, #0a4f78 0%, #0e6194 40%, #0a4f78 100%)"}}>
      {/* Enlace Volver al inicio */}
      <div className="absolute top-4 left-4 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center text-white/80 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
      </div>
      
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-8 shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <Image src="/sansi-logo.png" alt="SanSi Logo" width={128} height={128} className="mb-3" />
            <div className="text-center text-white">
              <div className="text-lg font-bold">Olimpiada Oh Sansi!</div>
              <div className="text-sm opacity-90">Sistema de Registro de Evaluaciones</div>
            </div>
          </div>

          <h1 className="text-center text-white text-2xl font-bold mb-6">Ingrese su Cuenta</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 bg-white rounded-md"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white rounded-md"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 bg-[#2b6cb0] hover:bg-[#245a90] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Ingresar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-white/80 text-sm">
            Ingresa tus credenciales para acceder al sistema
          </div>
        </div>
      </div>
    </div>
  )
}
