"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, RefreshCw, Save, Copy } from 'lucide-react'
import { MedalleroService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface MedalConfig {
  oro?: { min: number; max: number; cantidad: number }
  plata?: { min: number; max: number; cantidad: number }
  bronce?: { min: number; max: number; cantidad: number }
}

interface AreaConfig {
  [levelId: string]: MedalConfig
}

interface Area {
  id: number
  nombre: string
}

interface MedalleroData {
  id: number
  area_id: number
  area_nombre: string
  nivel_id: number
  nivel_nombre: string
  oro: number
  oro_min: number
  oro_max: number
  plata: number
  plata_min: number
  plata_max: number
  bronce: number
  bronce_min: number
  bronce_max: number
}

export default function MedalleroPage() {
  const [selectedArea, setSelectedArea] = useState<number | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [medalleroData, setMedalleroData] = useState<MedalleroData[]>([])
  const [config, setConfig] = useState<Record<number, AreaConfig>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generalConfig, setGeneralConfig] = useState<MedalConfig>({
    oro: { min: 0, max: 0, cantidad: 0 },
    plata: { min: 0, max: 0, cantidad: 0 },
    bronce: { min: 0, max: 0, cantidad: 0 },
  })
  const [showApplyConfirm, setShowApplyConfirm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Obtener áreas
        const areasRes = await MedalleroService.getAreas()
        try {
      const areasRes = await MedalleroService.getAreas();
      if (Array.isArray(areasRes)) {
        const structuredAreas: Area[] = areasRes.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
        }));
        setAreas(structuredAreas);
        console.log("Áreas cargadas:", structuredAreas);
      } else {
        console.warn("Respuesta de áreas no es válida:", areasRes);
      }
    } catch (error) {
      console.error("Error al cargar áreas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las áreas",
        variant: "destructive",
      });
    }
        
        // Obtener configuración de medallero
        const medalleroRes = await MedalleroService.getMedallero()
        if (Array.isArray(medalleroRes)) {
      setMedalleroData(medalleroRes);

      const structuredConfig: Record<number, Record<string, MedalConfig>> = {};

      medalleroRes.forEach((item: MedalleroData) => {
        if (!structuredConfig[item.area_id]) {
          structuredConfig[item.area_id] = {};
        }

        structuredConfig[item.area_id][item.nivel_nombre] = {
          oro: {
            min: item.oro_min,
            max: item.oro_max,
            cantidad: item.oro,
          },
          plata: {
            min: item.plata_min,
            max: item.plata_max,
            cantidad: item.plata,
          },
          bronce: {
            min: item.bronce_min,
            max: item.bronce_max,
            cantidad: item.bronce,
          },
        };
      });

      setConfig(structuredConfig);
    } else {
      console.warn("Respuesta de medallero no es válida:", medalleroRes);
    }
  } catch (error) {
    console.error("Error loading data:", error);
    toast({
      title: "Error",
      description: "No se pudo cargar los datos del medallero",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
};
    }
    
    fetchData()
  }, [toast])

  const currentArea = areas.find(a => a.id === selectedArea)
  const areaConfig: AreaConfig = selectedArea ? config[selectedArea] || {} : {}

  const getLevelsForArea = (areaId: number) => {
    const areaItems = medalleroData.filter(item => item.area_id === areaId)
    const uniqueLevels = Array.from(new Set(areaItems.map(item => item.nivel_nombre)))
    return uniqueLevels.sort()
  }

  const levels = selectedArea ? getLevelsForArea(selectedArea) : []
  const levelGroups = Array.from({ length: Math.ceil(levels.length / 3) }, (_, i) =>
    levels.slice(i * 3, i * 3 + 3)
  )

  const validateRanges = (levelId: string, updatedConfig: MedalConfig) => {
    const newErrors: Record<string, string> = {}
    const ranges: Array<{ type: string; min: number; max: number }> = []

    Object.entries(updatedConfig).forEach(([medalType, medalData]) => {
      if (medalData && medalData.min !== undefined && medalData.max !== undefined) {
        if (medalData.min >= 0 && medalData.max >= 0) {
          ranges.push({ type: medalType, min: medalData.min, max: medalData.max })
        }
      }
    })

    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const range1 = ranges[i]
        const range2 = ranges[j]

        const overlap =
          (range1.min <= range2.min && range2.min <= range1.max) ||
          (range1.min <= range2.max && range2.max <= range1.max) ||
          (range2.min <= range1.min && range1.max <= range2.max)

        if (overlap) {
          newErrors[range1.type] = `Se cruza con ${range2.type}`
          newErrors[range2.type] = `Se cruza con ${range1.type}`
        }
      }
    }

    Object.entries(updatedConfig).forEach(([medalType, medalData]) => {
      if (medalData && medalData.min > medalData.max) {
        newErrors[medalType] = "Min no puede ser mayor que Max"
      }
    })

    setErrors((prev) => ({
      ...prev,
      [levelId]: newErrors,
    }))

    return Object.keys(newErrors).length === 0
  }

  const handleMedalChange = (levelId: string, medalType: string, field: string, value: number) => {
    if (!selectedArea) return

    const updated = {
      ...config,
      [selectedArea]: {
        ...config[selectedArea],
        [levelId]: {
          ...(areaConfig[levelId] || {}),
          [medalType]: {
            ...(areaConfig[levelId]?.[medalType as keyof MedalConfig] || { min: 0, max: 0, cantidad: 0 }),
            [field]: value,
          },
        },
      },
    }
    setConfig(updated)
    validateRanges(levelId, updated[selectedArea][levelId])
    setHasChanges(true)
  }

  const handleGeneralMedalChange = (medalType: string, field: string, value: number) => {
    setGeneralConfig({
      ...generalConfig,
      [medalType]: {
        ...(generalConfig[medalType as keyof MedalConfig] || { min: 0, max: 0, cantidad: 0 }),
        [field]: value,
      },
    })
  }

  const validateGeneralConfig = (): boolean => {
    const ranges: Array<{ type: string; min: number; max: number }> = []
    
    Object.entries(generalConfig).forEach(([medalType, medalData]) => {
      if (medalData && medalData.min > medalData.max) {
        toast({
          title: "Error de validación",
          description: `${medalType}: Min no puede ser mayor que Max`,
          variant: "destructive"
        })
        return false
      }
      if (medalData && medalData.min >= 0 && medalData.max >= 0) {
        ranges.push({ type: medalType, min: medalData.min, max: medalData.max })
      }
    })

    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const r1 = ranges[i]
        const r2 = ranges[j]
        const overlap =
          (r1.min <= r2.min && r2.min <= r1.max) ||
          (r1.min <= r2.max && r2.max <= r1.max) ||
          (r2.min <= r1.min && r1.max <= r2.max)

        if (overlap) {
          toast({
            title: "Error de validación",
            description: `${r1.type} y ${r2.type} tienen rangos que se cruzan`,
            variant: "destructive"
          })
          return false
        }
      }
    }
    
    return true
  }

  const applyGeneralConfigToAllLevels = () => {
    if (!selectedArea || !validateGeneralConfig()) return

    const updatedConfig = { ...config }
    const updatedAreaConfig: AreaConfig = {}

    levels.forEach((level) => {
      updatedAreaConfig[level] = JSON.parse(JSON.stringify(generalConfig))
    })

    updatedConfig[selectedArea] = updatedAreaConfig
    setConfig(updatedConfig)
    setHasChanges(true)
    setShowApplyConfirm(false)

    toast({
      title: "Configuración aplicada",
      description: `Se aplicó la configuración general a todos los ${levels.length} niveles`,
    })
  }

  const validateAllConfig = () => {
    const allErrors: string[] = []
    let totalMedals = 0

    Object.entries(areaConfig).forEach(([levelId, levelConfig]: [string, any]) => {
      const medals = levelConfig as MedalConfig
      const ranges: Array<{ type: string; min: number; max: number }> = []

      Object.entries(medals).forEach(([type, medal]: [string, any]) => {
        if (medal && medal.min !== undefined && medal.max !== undefined) {
          if (medal.min > medal.max) {
            allErrors.push(`${levelId}: ${type.charAt(0).toUpperCase() + type.slice(1)}: Min > Max`)
          } else if (medal.min >= 0 && medal.max >= 0) {
            ranges.push({ type, min: medal.min, max: medal.max })
          }
          totalMedals += medal.cantidad || 0
        }
      })

      for (let i = 0; i < ranges.length; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
          const r1 = ranges[i]
          const r2 = ranges[j]
          const overlap =
            (r1.min <= r2.min && r2.min <= r1.max) ||
            (r1.min <= r2.max && r2.max <= r1.max) ||
            (r2.min <= r1.min && r1.max <= r2.max)

          if (overlap) {
            allErrors.push(`${levelId}: ${r1.type} y ${r2.type} se cruzan`)
          }
        }
      }
    })

    return { allErrors, totalMedals }
  }

  const handleSave = async () => { 
    if (!selectedArea) return 
    try { setSaving(true) 
      const dataToSave = medalleroData .filter(
        item => item.area_id === selectedArea) .map(item => { 
          const levelConfig = config[selectedArea]?.[
            item.nivel_nombre] || {} 
            return { id_medallero: item.id, 
              area_id: selectedArea, 
              area_nombre: currentArea?.nombre, 
              nivel_id: item.nivel_id, 
              nivel_nombre: item.nivel_nombre, 
              oro: levelConfig.oro?.cantidad || 0, 
              oro_min: levelConfig.oro?.min || 0, 
              oro_max: levelConfig.oro?.max || 0,
              plata: levelConfig.plata?.cantidad || 0, 
              plata_min: levelConfig.plata?.min || 0, 
              plata_max: levelConfig.plata?.max || 0, 
              bronce: levelConfig.bronce?.cantidad || 0, 
              bronce_min: levelConfig.bronce?.min || 0, 
              bronce_max: levelConfig.bronce?.max || 0, } }) 
              console.log("Guardando configuración:", dataToSave) 
              // Llamada real al backend 
              const res = await MedalleroService.updateMedallero(dataToSave) 
              if (res.success) { 
                toast({ title: "Guardado", description: "Configuración guardada exitosamente" }) 
                setHasChanges(false) 
              } else { throw new Error(res.message) 

              } 
            } catch (error: any) { 
              console.error("Error saving:", error) 
              toast({ title: "Error", description: error.message || "No se pudo guardar la configuración", variant: "destructive" }) 
            } finally { 
              setSaving(false) 
            } 
            } 

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando medallero...</p>
        </div>
      </div>
    )
  }

  if (!selectedArea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">Gestión de Medallero</h1>
            <p className="text-lg text-gray-600">Selecciona un área para configurar sus medallas</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className="group p-8 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="text-6xl mb-4 transition-transform group-hover:scale-110">📚</div>
                <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {area.nombre}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { allErrors, totalMedals } = validateAllConfig()
  const isValid = allErrors.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedArea(null)}
              className="text-2xl hover:scale-110 transition-transform p-2 hover:bg-white rounded-lg"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-5xl">📚</span>
                <h1 className="text-4xl font-bold text-gray-900">{currentArea?.nombre}</h1>
              </div>
              <p className="text-gray-600 mt-1">Configura medallas para cada nivel</p>
            </div>
          </div>
        </div>

        {levelGroups.length > 0 ? (
          <Tabs defaultValue="general" className="bg-white rounded-xl border-2 border-blue-200 shadow-lg p-6 mb-8">
            <TabsList className="grid w-full gap-2 grid-cols-2">
              <TabsTrigger value="general" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                ⚙️ Configuración General
              </TabsTrigger>
              <TabsTrigger value="levels" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                📋 Configuración por Nivel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-pink-50">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-pink-500">
                  <CardTitle className="text-lg text-white">Aplicar configuración a todos los niveles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <p className="text-gray-700 text-sm">
                    Define los rangos de medallas a continuación. Estos valores se aplicarán a todos los {levels.length} niveles del área automáticamente.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(generalConfig).map((medalType) => {
                      const medalData = generalConfig[medalType as keyof MedalConfig] || { min: 0, max: 0, cantidad: 0 }

                      return (
                        <div
                          key={medalType}
                          className={`border-2 rounded-lg p-4 transition-all ${medalType === "oro" ? "bg-yellow-50 border-yellow-300" : medalType === "plata" ? "bg-slate-50 border-slate-300" : "bg-orange-50 border-orange-300"}`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{medalType === "oro" ? "🥇" : medalType === "plata" ? "🥈" : "🥉"}</span>
                            <h4 className="font-semibold text-gray-900">{medalType.charAt(0).toUpperCase() + medalType.slice(1)}</h4>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-700">Rango de Puntaje</Label>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={medalData.min || 0}
                                  onChange={(e) =>
                                    handleGeneralMedalChange(medalType, "min", Number.parseInt(e.target.value))
                                  }
                                  placeholder="Min"
                                  className="h-8 text-sm border-blue-200 focus:border-blue-500"
                                />
                                <span className="text-gray-500 text-sm font-medium">-</span>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={medalData.max || 0}
                                  onChange={(e) =>
                                    handleGeneralMedalChange(medalType, "max", Number.parseInt(e.target.value))
                                  }
                                  placeholder="Max"
                                  className="h-8 text-sm border-blue-200 focus:border-blue-500"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-700">Cantidad</Label>
                              <Input
                                type="number"
                                min="0"
                                value={medalData.cantidad || 0}
                                onChange={(e) =>
                                  handleGeneralMedalChange(medalType, "cantidad", Number.parseInt(e.target.value))
                                }
                                placeholder="0"
                                className="h-8 text-sm border-blue-200 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {showApplyConfirm && (
                    <Card className="border-2 border-amber-200 bg-amber-50">
                      <CardContent className="pt-6">
                        <p className="text-sm text-amber-900 mb-4">
                          ¿Confirmas que deseas aplicar esta configuración a los {levels.length} niveles?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={applyGeneralConfigToAllLevels}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Sí, aplicar
                          </Button>
                          <Button
                            onClick={() => setShowApplyConfirm(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={() => setShowApplyConfirm(true)}
                    className="w-full h-11 font-semibold text-base transition-all bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Aplicar a todos los {levels.length} niveles
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="levels" className="space-y-6 mt-6">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))` }}>
                {levels.map((level, index) => (
                  <button
                    key={level}
                    className="p-2 rounded-lg border-2 border-blue-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium text-gray-900"
                  >
                    {level}
                  </button>
                ))}
              </div>

              {levelGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.map((level) => {
                    const levelData = areaConfig[level] || {}
                    const levelErrors = errors[level] || {}

                    return (
                      <Card key={level} className="border-2 border-blue-100 bg-white shadow-md mb-4">
                        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-pink-50">
                          <CardTitle className="text-lg text-gray-900">{level}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.keys(levelData).map((medalType) => {
                              const key = medalType as keyof MedalConfig
                              const medalData = levelData[key] || { min: 0, max: 0, cantidad: 0 }
                              const hasError = levelErrors[medalType]

                              return (
                                <div
                                  key={medalType}
                                  className={`border-2 rounded-lg p-4 transition-all ${medalType === "oro" ? "bg-yellow-50 border-yellow-300" : medalType === "plata" ? "bg-slate-50 border-slate-300" : "bg-orange-50 border-orange-300"} ${
                                    hasError ? "ring-2 ring-red-300 bg-red-50" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl">{medalType === "oro" ? "🥇" : medalType === "plata" ? "🥈" : "🥉"}</span>
                                    <h4 className="font-semibold text-gray-900">{medalType.charAt(0).toUpperCase() + medalType.slice(1)}</h4>
                                  </div>

                                  {hasError && (
                                    <div className="mb-3 flex items-center gap-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                                      <AlertCircle size={16} />
                                      <span>{hasError}</span>
                                    </div>
                                  )}

                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold text-gray-700">Rango de Puntaje</Label>
                                      <div className="flex gap-2 items-center">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={medalData.min || 0}
                                          onChange={(e) =>
                                            handleMedalChange(level, medalType, "min", Number.parseInt(e.target.value))
                                          }
                                          placeholder="Min"
                                          className="h-8 text-sm border-blue-200 focus:border-blue-500"
                                        />
                                        <span className="text-gray-500 text-sm font-medium">-</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={medalData.max || 0}
                                          onChange={(e) =>
                                            handleMedalChange(level, medalType, "max", Number.parseInt(e.target.value))
                                          }
                                          placeholder="Max"
                                          className="h-8 text-sm border-blue-200 focus:border-blue-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold text-gray-700">Cantidad</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={medalData.cantidad || 0}
                                        onChange={(e) =>
                                          handleMedalChange(level, medalType, "cantidad", Number.parseInt(e.target.value))
                                        }
                                        placeholder="0"
                                        className="h-8 text-sm border-blue-200 focus:border-blue-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-2 border-yellow-200 bg-yellow-50 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-yellow-600" />
                <p className="text-yellow-800">No hay niveles configurados para esta área</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview and validation */}
        <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-500 to-pink-500">
            <CardTitle className="text-lg text-white">Resumen y Validación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300 text-center">
                <div className="text-3xl mb-2">🥇</div>
                <div className="text-xs text-gray-600 font-medium">Oro</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {Object.values(areaConfig).reduce((sum: number, level: any) => sum + (level.oro?.cantidad || 0), 0)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-300 text-center">
                <div className="text-3xl mb-2">🥈</div>
                <div className="text-xs text-gray-600 font-medium">Plata</div>
                <div className="text-2xl font-bold text-slate-700">
                  {Object.values(areaConfig).reduce((sum: number, level: any) => sum + (level.plata?.cantidad || 0), 0)}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-300 text-center">
                <div className="text-3xl mb-2">🥉</div>
                <div className="text-xs text-gray-600 font-medium">Bronce</div>
                <div className="text-2xl font-bold text-orange-700">
                  {Object.values(areaConfig).reduce(
                    (sum: number, level: any) => sum + (level.bronce?.cantidad || 0),
                    0,
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Total de medallas a entregar:</span>
                <span className="text-3xl font-bold text-blue-600">{totalMedals}</span>
              </div>
            </div>

            {allErrors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300 space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                  <AlertCircle size={20} />
                  Errores detectados:
                </div>
                <ul className="space-y-1 pl-6">
                  {allErrors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-700 list-disc">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isValid && hasChanges && (
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300 flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle2 size={20} />
                <span>Configuración válida y lista para guardar</span>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={!hasChanges || !isValid || saving}
              className="w-full h-11 font-semibold text-base transition-all bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : !hasChanges ? "Sin cambios" : !isValid ? "Resolver errores" : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

}