"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"

interface FormData {
  
  firstName: string
  lastName: string
  ci: string
  birthDate: string
  grade: string
  school: string
  department: string
  phone: string
  email: string

  
  selectedAreas: string[]

 
  teams: {
    [key: string]: {
      teamName: string
      members: Array<{
        name: string
        ci: string
        email: string
        phone: string
      }>
    }
  }
}

interface TeamMember {
  name: string
  ci: string
  email: string
  phone: string
}

interface AreaCompetencia {
  id: number
  nombre: string
  descripcion: string
  permite_grupos: boolean
}

export default function RegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [competitionAreas, setCompetitionAreas] = useState<AreaCompetencia[]>([])
  const [loadingAreas, setLoadingAreas] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    ci: "",
    birthDate: "",
    grade: "",
    school: "",
    department: "",
    phone: "",
    email: "",
    selectedAreas: [],
    teams: {},
  })

  // Función para cargar áreas de competencia desde la API
  const fetchAreas = async () => {
    try {
      setLoadingAreas(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'
      const response = await fetch(`${API_BASE_URL}/api/areas-competencia`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setCompetitionAreas(data.data)
      } else {
        console.error('Error al obtener áreas:', data.message)
        // Fallback a datos hardcodeados si la API falla
        setCompetitionAreas([
          { id: 1, nombre: "Matemáticas", descripcion: "Competencia de Matemáticas", permite_grupos: false },
          { id: 2, nombre: "Física", descripcion: "Competencia de Física", permite_grupos: false },
          { id: 3, nombre: "Química", descripcion: "Competencia de Química", permite_grupos: false },
          { id: 4, nombre: "Biología", descripcion: "Competencia de Biología", permite_grupos: false },
          { id: 5, nombre: "Astronomía", descripcion: "Competencia de Astronomía", permite_grupos: false },
          { id: 6, nombre: "Geografía", descripcion: "Competencia de Geografía", permite_grupos: false },
          { id: 7, nombre: "Robótica e Informática", descripcion: "Competencia de Robótica e Informática", permite_grupos: true },
          { id: 8, nombre: "Feria Científica", descripcion: "Competencia de Feria Científica", permite_grupos: true },
        ])
      }
    } catch (error) {
      console.error('Error al obtener áreas:', error)
      // Fallback a datos hardcodeados si hay error de red
      setCompetitionAreas([
        { id: 1, nombre: "Matemáticas", descripcion: "Competencia de Matemáticas", permite_grupos: false },
        { id: 2, nombre: "Física", descripcion: "Competencia de Física", permite_grupos: false },
        { id: 3, nombre: "Química", descripcion: "Competencia de Química", permite_grupos: false },
        { id: 4, nombre: "Biología", descripcion: "Competencia de Biología", permite_grupos: false },
        { id: 5, nombre: "Astronomía", descripcion: "Competencia de Astronomía", permite_grupos: false },
        { id: 6, nombre: "Geografía", descripcion: "Competencia de Geografía", permite_grupos: false },
        { id: 7, nombre: "Robótica e Informática", descripcion: "Competencia de Robótica e Informática", permite_grupos: true },
        { id: 8, nombre: "Feria Científica", descripcion: "Competencia de Feria Científica", permite_grupos: true },
      ])
    } finally {
      setLoadingAreas(false)
    }
  }

  // Cargar áreas al montar el componente
  useEffect(() => {
    fetchAreas()
  }, [])

  const departments = ["La Paz", "Cochabamba", "Santa Cruz", "Oruro", "Potosí", "Tarija", "Chuquisaca", "Beni", "Pando"]

  const grades = [
    "1ro Secundaria",
    "2do Secundaria",
    "3ro Secundaria",
    "4to Secundaria",
    "5to Secundaria",
    "6to Secundaria",
  ]

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = "El nombre es requerido"
      if (!formData.lastName) newErrors.lastName = "El apellido es requerido"
      if (!formData.ci) newErrors.ci = "El CI es requerido"
      if (!formData.birthDate) newErrors.birthDate = "La fecha de nacimiento es requerida"
      if (!formData.grade) newErrors.grade = "El grado escolar es requerido"
      if (!formData.school) newErrors.school = "La unidad educativa es requerida"
      if (!formData.department) newErrors.department = "El departamento es requerido"
      if (!formData.phone) newErrors.phone = "El teléfono es requerido"
      if (!formData.email) newErrors.email = "El email es requerido"
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email inválido"
    }

    if (step === 2) {
      if (formData.selectedAreas.length === 0) {
        newErrors.selectedAreas = "Debe seleccionar al menos un área de competencia"
      }
    }

    if (step === 3) {
      
      const groupAreas = formData.selectedAreas.filter(
        (areaId) => competitionAreas.find((area) => area.id.toString() === areaId)?.permite_grupos,
      )

      for (const areaId of groupAreas) {
        const team = formData.teams[areaId]
        if (!team || !team.teamName) {
          newErrors[`team_${areaId}`] = "Nombre del equipo requerido"
        }
        if (!team || team.members.length < 2) {
          newErrors[`members_${areaId}`] = "Se requieren al menos 2 miembros del equipo"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleAreaToggle = (areaId: string) => {
    setFormData((prev) => {
      const newSelectedAreas = prev.selectedAreas.includes(areaId)
        ? prev.selectedAreas.filter((id) => id !== areaId)
        : [...prev.selectedAreas, areaId]

      
      const newTeams = { ...prev.teams }
      const area = competitionAreas.find((a) => a.id.toString() === areaId)

      if (area && area.permite_grupos && newSelectedAreas.includes(areaId)) {
        if (!newTeams[areaId]) {
          newTeams[areaId] = {
            teamName: "",
            members: [
              { name: "", ci: "", email: "", phone: "" },
              { name: "", ci: "", email: "", phone: "" },
            ],
          }
        }
      } else if (!newSelectedAreas.includes(areaId)) {
        delete newTeams[areaId]
      }

      return {
        ...prev,
        selectedAreas: newSelectedAreas,
        teams: newTeams,
      }
    })
  }

  const addTeamMember = (areaId: string) => {
    setFormData((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [areaId]: {
          ...prev.teams[areaId],
          members: [...prev.teams[areaId].members, { name: "", ci: "", email: "", phone: "" }],
        },
      },
    }))
  }

  const removeTeamMember = (areaId: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [areaId]: {
          ...prev.teams[areaId],
          members: prev.teams[areaId].members.filter((_, i) => i !== index),
        },
      },
    }))
  }

  const updateTeamMember = (areaId: string, index: number, field: keyof TeamMember, value: string) => {
    setFormData((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [areaId]: {
          ...prev.teams[areaId],
          members: prev.teams[areaId].members.map((member, i) =>
            i === index ? { ...member, [field]: value } : member,
          ),
        },
      },
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)

    
    await new Promise((resolve) => setTimeout(resolve, 2000))

    
    console.log("Form submitted:", formData)

    setIsSubmitting(false)
    setCurrentStep(totalSteps + 1) 
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Información Personal</h2>
              <p className="text-muted-foreground">Completa tus datos personales y de contacto</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellidos *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ci">Cédula de Identidad *</Label>
                <Input
                  id="ci"
                  value={formData.ci}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ci: e.target.value }))}
                  className={errors.ci ? "border-destructive" : ""}
                />
                {errors.ci && <p className="text-sm text-destructive">{errors.ci}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                  className={errors.birthDate ? "border-destructive" : ""}
                />
                {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grado Escolar *</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, grade: value }))}
                >
                  <SelectTrigger className={errors.grade ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona tu grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className={errors.department ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona tu departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="school">Unidad Educativa *</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData((prev) => ({ ...prev, school: e.target.value }))}
                  className={errors.school ? "border-destructive" : ""}
                  placeholder="Nombre completo de tu colegio"
                />
                {errors.school && <p className="text-sm text-destructive">{errors.school}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className={errors.phone ? "border-destructive" : ""}
                  placeholder="+591 XXXXXXXX"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? "border-destructive" : ""}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <GraduationCap className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Áreas de Competencia</h2>
              <p className="text-muted-foreground">Selecciona las áreas en las que deseas participar</p>
            </div>

            {errors.selectedAreas && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                  <p className="text-sm text-destructive">{errors.selectedAreas}</p>
                </div>
              </div>
            )}

            {loadingAreas ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Cargando áreas de competencia...</div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitionAreas.map((area) => (
                <Card
                  key={area.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.selectedAreas.includes(area.id.toString()) ? "ring-2 ring-primary bg-card" : ""
                  }`}
                    onClick={() => handleAreaToggle(area.id.toString())}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">
                          {area.nombre === "Matemáticas" && "📐"}
                          {area.nombre === "Física" && "⚛️"}
                          {area.nombre === "Química" && "🧪"}
                          {area.nombre === "Biología" && "🧬"}
                          {area.nombre === "Astronomía" && "🌟"}
                          {area.nombre === "Geografía" && "🌍"}
                          {area.nombre === "Robótica e Informática" && "🤖"}
                          {area.nombre === "Feria Científica" && "🔬"}
                          {!["Matemáticas", "Física", "Química", "Biología", "Astronomía", "Geografía", "Robótica e Informática", "Feria Científica"].includes(area.nombre) && "🏆"}
                        </div>
                      <Checkbox
                          checked={formData.selectedAreas.includes(area.id.toString())}
                          onChange={() => handleAreaToggle(area.id.toString())}
                      />
                    </div>
                      <h3 className="font-heading font-semibold text-lg mb-2">{area.nombre}</h3>
                    <div className="flex items-center gap-2">
                        <Badge variant={!area.permite_grupos ? "secondary" : "outline"}>
                          {!area.permite_grupos ? "Individual" : "Grupal"}
                      </Badge>
                        {!area.permite_grupos ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Áreas seleccionadas: {formData.selectedAreas.length}</h4>
              <div className="flex flex-wrap gap-2">
                {formData.selectedAreas.map((areaId) => {
                  const area = competitionAreas.find((a) => a.id.toString() === areaId)
                  return (
                    <Badge key={areaId} variant="default">
                      {area?.nombre === "Matemáticas" && "📐"}
                      {area?.nombre === "Física" && "⚛️"}
                      {area?.nombre === "Química" && "🧪"}
                      {area?.nombre === "Biología" && "🧬"}
                      {area?.nombre === "Astronomía" && "🌟"}
                      {area?.nombre === "Geografía" && "🌍"}
                      {area?.nombre === "Robótica e Informática" && "🤖"}
                      {area?.nombre === "Feria Científica" && "🔬"}
                      {area?.nombre && !["Matemáticas", "Física", "Química", "Biología", "Astronomía", "Geografía", "Robótica e Informática", "Feria Científica"].includes(area.nombre) && "🏆"}
                      {" "}{area?.nombre}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 3:
        const groupAreas = formData.selectedAreas.filter(
          (areaId) => competitionAreas.find((area) => area.id.toString() === areaId)?.permite_grupos,
        )

        if (groupAreas.length === 0) {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">¡Perfecto!</h2>
                <p className="text-muted-foreground">
                  Solo seleccionaste áreas individuales, no necesitas registrar equipos.
                </p>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Información de Equipos</h2>
              <p className="text-muted-foreground">Registra los datos de tus compañeros de equipo</p>
            </div>

            {groupAreas.map((areaId) => {
              const area = competitionAreas.find((a) => a.id.toString() === areaId)
              const team = formData.teams[areaId]

              return (
                <Card key={areaId} className="p-6">
                  <div className="flex items-center mb-6">
                    <span className="text-2xl mr-3">
                      {area?.nombre === "Matemáticas" && "📐"}
                      {area?.nombre === "Física" && "⚛️"}
                      {area?.nombre === "Química" && "🧪"}
                      {area?.nombre === "Biología" && "🧬"}
                      {area?.nombre === "Astronomía" && "🌟"}
                      {area?.nombre === "Geografía" && "🌍"}
                      {area?.nombre === "Robótica e Informática" && "🤖"}
                      {area?.nombre === "Feria Científica" && "🔬"}
                      {area?.nombre && !["Matemáticas", "Física", "Química", "Biología", "Astronomía", "Geografía", "Robótica e Informática", "Feria Científica"].includes(area.nombre) && "🏆"}
                    </span>
                    <div>
                      <h3 className="font-heading font-semibold text-lg">{area?.nombre}</h3>
                      <p className="text-sm text-muted-foreground">Equipo de 2-4 miembros</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`teamName_${areaId}`}>Nombre del Equipo *</Label>
                      <Input
                        id={`teamName_${areaId}`}
                        value={team?.teamName || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            teams: {
                              ...prev.teams,
                              [areaId]: {
                                ...prev.teams[areaId],
                                teamName: e.target.value,
                              },
                            },
                          }))
                        }
                        className={errors[`team_${areaId}`] ? "border-destructive" : ""}
                        placeholder="Nombre creativo para tu equipo"
                      />
                      {errors[`team_${areaId}`] && (
                        <p className="text-sm text-destructive">{errors[`team_${areaId}`]}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Miembros del Equipo *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTeamMember(areaId)}
                          disabled={team?.members.length >= 4}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Miembro
                        </Button>
                      </div>

                      {team?.members.map((member, index) => (
                        <Card key={index} className="p-4 bg-muted/30">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">Miembro {index + 1}</h4>
                            {team.members.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamMember(areaId, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nombre Completo</Label>
                              <Input
                                value={member.name}
                                onChange={(e) => updateTeamMember(areaId, index, "name", e.target.value)}
                                placeholder="Nombre y apellidos"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>CI</Label>
                              <Input
                                value={member.ci}
                                onChange={(e) => updateTeamMember(areaId, index, "ci", e.target.value)}
                                placeholder="Cédula de identidad"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={member.email}
                                onChange={(e) => updateTeamMember(areaId, index, "email", e.target.value)}
                                placeholder="email@ejemplo.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Teléfono</Label>
                              <Input
                                value={member.phone}
                                onChange={(e) => updateTeamMember(areaId, index, "phone", e.target.value)}
                                placeholder="+591 XXXXXXXX"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {errors[`members_${areaId}`] && (
                        <p className="text-sm text-destructive">{errors[`members_${areaId}`]}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Revisar y Confirmar</h2>
              <p className="text-muted-foreground">Verifica que toda la información sea correcta</p>
            </div>

            <div className="space-y-6">
              {/* Personal Information Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Nombre:</strong> {formData.firstName} {formData.lastName}
                    </div>
                    <div>
                      <strong>CI:</strong> {formData.ci}
                    </div>
                    <div>
                      <strong>Fecha de Nacimiento:</strong> {formData.birthDate}
                    </div>
                    <div>
                      <strong>Grado:</strong> {formData.grade}
                    </div>
                    <div>
                      <strong>Colegio:</strong> {formData.school}
                    </div>
                    <div>
                      <strong>Departamento:</strong> {formData.department}
                    </div>
                    <div>
                      <strong>Teléfono:</strong> {formData.phone}
                    </div>
                    <div>
                      <strong>Email:</strong> {formData.email}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competition Areas Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Áreas de Competencia ({formData.selectedAreas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedAreas.map((areaId) => {
                      const area = competitionAreas.find((a) => a.id.toString() === areaId)
                      return (
                        <Badge key={areaId} variant="default" className="text-sm">
                          {area?.nombre === "Matemáticas" && "📐"}
                          {area?.nombre === "Física" && "⚛️"}
                          {area?.nombre === "Química" && "🧪"}
                          {area?.nombre === "Biología" && "🧬"}
                          {area?.nombre === "Astronomía" && "🌟"}
                          {area?.nombre === "Geografía" && "🌍"}
                          {area?.nombre === "Robótica e Informática" && "🤖"}
                          {area?.nombre === "Feria Científica" && "🔬"}
                          {area?.nombre && !["Matemáticas", "Física", "Química", "Biología", "Astronomía", "Geografía", "Robótica e Informática", "Feria Científica"].includes(area.nombre) && "🏆"}
                          {" "}{area?.nombre}
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Teams Summary */}
              {Object.keys(formData.teams).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Equipos Registrados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(formData.teams).map(([areaId, team]) => {
                      const area = competitionAreas.find((a) => a.id.toString() === areaId)
                      return (
                        <div key={areaId} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">
                            {area?.nombre === "Matemáticas" && "📐"}
                            {area?.nombre === "Física" && "⚛️"}
                            {area?.nombre === "Química" && "🧪"}
                            {area?.nombre === "Biología" && "🧬"}
                            {area?.nombre === "Astronomía" && "🌟"}
                            {area?.nombre === "Geografía" && "🌍"}
                            {area?.nombre === "Robótica e Informática" && "🤖"}
                            {area?.nombre === "Feria Científica" && "🔬"}
                            {area?.nombre && !["Matemáticas", "Física", "Química", "Biología", "Astronomía", "Geografía", "Robótica e Informática", "Feria Científica"].includes(area.nombre) && "🏆"}
                            {" "}{area?.nombre}: "{team.teamName}"
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            <strong>Miembros ({team.members.length}):</strong>
                            <ul className="list-disc list-inside mt-1">
                              {team.members.map((member, index) => (
                                <li key={index}>
                                  {member.name} - {member.ci}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 mx-auto text-primary" />
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground mb-4">¡Inscripción Exitosa!</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Tu inscripción ha sido registrada correctamente. Recibirás un email de confirmación en breve.
              </p>
              <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold mb-2">Próximos pasos:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>• Revisa tu email para la confirmación</li>
                  <li>• Mantente atento a las fechas de evaluación</li>
                  <li>• Prepárate para la competencia</li>
                </ul>
              </div>
              <Link href="/">
                <Button className="mt-6">Volver al Inicio</Button>
              </Link>
            </div>
          </div>
        )
    }
  }

  if (currentStep > totalSteps) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">{renderStepContent()}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Badge variant="outline">Inscripción 2025</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-heading font-bold text-foreground">Inscripción a la Olimpiada</h1>
              <div className="text-sm text-muted-foreground">
                Paso {currentStep} de {totalSteps}
              </div>
            </div>

            <Progress value={progress} className="h-2 mb-4" />

            <div className="flex justify-between text-sm">
              <span className={currentStep >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
                Datos Personales
              </span>
              <span className={currentStep >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
                Áreas de Competencia
              </span>
              <span className={currentStep >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>Equipos</span>
              <span className={currentStep >= 4 ? "text-primary font-medium" : "text-muted-foreground"}>
                Confirmación
              </span>
            </div>
          </div>

          {/* Form Content */}
          <Card className="mb-8">
            <CardContent className="p-8">{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Confirmar Inscripción"}
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
