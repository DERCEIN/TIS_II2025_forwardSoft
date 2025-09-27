"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { LogIn, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const roles = [
    {
      id: "admin",
      name: "Administrador",
      description: "Acceso completo al sistema",
      color: "bg-red-100 text-red-800 border-red-200",
    },
    {
      id: "coordinator",
      name: "Coordinador de Área",
      description: "Gestión de área específica",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      id: "evaluator",
      name: "Evaluador",
      description: "Evaluación de participantes",
      color: "bg-green-100 text-green-800 border-green-200",
    },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    
    setTimeout(() => {
      if (email && password && selectedRole) {
        
        switch (selectedRole) {
          case "admin":
            window.location.href = "/admin/dashboard"
            break
          case "coordinator":
            window.location.href = "/coordinator/dashboard"
            break
          case "evaluator":
            window.location.href = "/evaluator/dashboard"
            break
        }
      } else {
        setError("Por favor complete todos los campos")
        setIsLoading(false)
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/sansi-logo.png" alt="SanSi Logo" className="h-10 w-auto" />
            <span className="text-2xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
          </div>
          <p className="text-muted-foreground">Sistema de Gestión</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-heading text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">Accede a tu área de trabajo según tu rol</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Selecciona tu rol</Label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                        selectedRole === role.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{role.name}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${role.color}`}>
                          {role.name.split(" ")[0]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button type="submit" className="w-full h-11" disabled={isLoading || !selectedRole}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Iniciando sesión...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
