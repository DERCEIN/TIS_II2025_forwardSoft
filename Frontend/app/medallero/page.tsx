"use client"

import { useState, useMemo, useEffect } from "react"
import type { Olimpista, Area, Level, PublishedResult } from "@/lib/types"
import { generateMockOlimpistas } from "@/lib/data"
import FilterPanel from "./FilterPanel"
import ResultsList from "./ResultsList"
import { PublicResultsService } from "@/lib/api"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
export default function PublicResults() {
  const [olimpistas, setOlimpistas] = useState<Olimpista[]>([])
  const [loading, setLoading] = useState(true)
  const [searchName, setSearchName] = useState("")
  const [selectedArea, setSelectedArea] = useState<Area | "">("")
  const [selectedLevel, setSelectedLevel] = useState<Level | "">("")
  const [configPublicacion, setConfigPublicacion] = useState<
  { area_nombre: string; publicacion_inicio: string; publicacion_fin: string }[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const response = await PublicResultsService.getMedalleroFinal()
        console.log("Respuesta completa del medallero:", response)
        
        // El backend devuelve { success: true, data: { olimpistas: [], configPublicacion: [] } }
        const data = response.data || response
        const olimpistasData = data.olimpistas || []
        const configData = data.configPublicacion || []
        
        console.log("Olimpistas extraídos:", olimpistasData)
        console.log("Config publicación extraída:", configData)
        
        setOlimpistas(olimpistasData)
        setConfigPublicacion(configData)
      } catch (err) {
        console.error("Error cargando medallero:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

const today = new Date();
  console.log("Olimpistas cargados:", olimpistas)
  const filteredResults = useMemo(() => {
    return olimpistas.filter((o) => {
      const matchName = searchName === "" || o.nombre.toLowerCase().includes(searchName.toLowerCase())
      const matchArea = selectedArea === "" || !selectedArea || o.area === selectedArea
      const matchLevel = selectedLevel === "" || !selectedLevel || o.nivel === selectedLevel
      const areaConfig = configPublicacion.find(c => c.area_nombre === o.area);
      const withinDate = areaConfig 
        ? (today >= new Date(areaConfig.publicacion_inicio) && today <= new Date(areaConfig.publicacion_fin))
        : true; // Si no hay configuración, mostrar todos (para debugging)

    return matchName && matchArea && matchLevel && withinDate;
  });
}, [olimpistas, searchName, selectedArea, selectedLevel, configPublicacion]);
  const medallistas = filteredResults.filter((o) => o.medalla)
  const mencion = filteredResults.filter((o) => o.tieneHonor)

  return (
    <div className="space-y-8">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/sansi-logo.png" alt="SanSi Logo" className="h-10 w-auto" />
              <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="/#inicio" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Inicio
              </a>
              <a
                href="/#areas"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Áreas de Competencia
              </a>
              <Link
                href="/resultados"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Resultados
              </Link>
              <Link
                href="/medallero"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Medallero
              </Link>
              <a
                href="/#noticias"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Noticias
              </a>
              <a
                href="/#contacto"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Contacto
              </a>
            </nav>

            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn className="h-4 w-4 mr-2" />
                Acceso
              </Button>
            </Link>
          </div>
        </div>
      </header>
    <div className="bg-gradient-to-r from-yellow-400 via-gray-300 to-orange-600 text-white text-center py-8 px-4 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold drop-shadow-md">🏅 Zona de Medallistas - Olimpiadas Oh-Sansi 🏅</h1>
      <p className="mt-2 text-lg font-medium drop-shadow-sm">¡Bienvenido! Aquí puedes ver a los mejores participantes y sus logros.</p>
    </div>
      <FilterPanel
        searchName={searchName}
        onSearchNameChangeAction={setSearchName}
        selectedArea={selectedArea}
        onAreaChangeAction={setSelectedArea}
        selectedLevel={selectedLevel}
        onLevelChangeAction={setSelectedLevel}
      />

      {selectedArea && (() => {
        const fechaAreaSeleccionada = configPublicacion.find(c => c.area_nombre === selectedArea)
        if (fechaAreaSeleccionada) {
          return (
            <div className="mb-4 text-center text-sm text-muted-foreground">
              Publicación disponible desde: {new Date(fechaAreaSeleccionada.publicacion_inicio).toLocaleDateString()} 
            </div>
          )
        } else {
          return (
            <div className="mb-4 text-center text-sm text-muted-foreground">
              No hay publicaciones para {selectedArea} todavía. Vuelva más tarde.
            </div>
          )
        }
      })()}

       {loading ? (
            <div className="w-full py-20 flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* ❗ SIN DATOS */}
              {medallistas.length === 0 && mencion.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-lg">
                  No hay publicaciones actualmente, vuelva después.
                </div>
              ) : (
                <ResultsList medallistas={medallistas} mencion={mencion} />
              )}
            </>
          )}
    </div>

  )
}
