"use client"

import { useState, useMemo, useEffect } from "react"
import type { Olimpista, Area, Level, PublishedResult } from "@/lib/types"
import { generateMockOlimpistas } from "@/lib/data"
import FilterPanel from "./FilterPanel"
import ResultsList from "./ResultsList"
import { PublicResultsService } from "@/lib/api"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, Trophy } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <img src="/sansi-logo.png" alt="SanSi Logo" className="h-8 sm:h-10 w-auto" />
              <span className="text-lg sm:text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link href="/#inicio" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Inicio
              </Link>
              <Link
                href="/resultados"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Resultados
              </Link>
              <Link
                href="/medallero"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Medallero
              </Link>
              <Link
                href="/#contacto"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Contacto
              </Link>
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

      {/* Banner Section con estilo de página principal */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-blue-900 mb-3 sm:mb-4">
            🏅 Zona de Medallistas - Olimpiadas Oh-Sansi 🏅
          </h1>
          <p className="text-lg sm:text-xl text-blue-800 font-medium px-4">
            ¡Bienvenido! Aquí puedes ver a los mejores participantes y sus logros.
          </p>
        </div>
      </section>
      {/* Panel de filtros */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 sm:px-6">
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
                <div className="mt-4 text-center text-sm text-gray-600">
                  Publicación disponible desde: {new Date(fechaAreaSeleccionada.publicacion_inicio).toLocaleDateString()} 
                </div>
              )
            } else {
              return (
                <div className="mt-4 text-center text-sm text-gray-600">
                  No hay publicaciones para {selectedArea} todavía. Vuelva más tarde.
                </div>
              )
            }
          })()}
        </div>
      </section>

      {/* Resultados */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="w-full py-20 flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* ❗ SIN DATOS */}
              {medallistas.length === 0 && mencion.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-lg">
                  No hay publicaciones actualmente, vuelva después.
                </div>
              ) : (
                <ResultsList medallistas={medallistas} mencion={mencion} />
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-slate-50 border-t mt-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-heading font-bold text-slate-800">Olimpiada Oh! SanSi</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 max-w-md">
                Olimpiada en Ciencias y Tecnología de la Universidad Mayor de San Simón, promoviendo la excelencia
                académica en Bolivia desde 2010.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Enlaces</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li>
                  <a href="/#inicio" className="hover:text-blue-600 transition-colors">
                    Inicio
                  </a>
                </li>
                <li>
                  <Link href="/cronograma" className="hover:text-blue-600 transition-colors">
                    Cronograma
                  </Link>
                </li>
                <li>
                  <Link href="/resultados" className="hover:text-blue-600 transition-colors">
                    Resultados
                  </Link>
                </li>
                <li>
                  <Link href="/medallero" className="hover:text-blue-600 transition-colors">
                    Medallero
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Contacto</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li>Universidad Mayor de San Simón</li>
                <li>Cochabamba, Bolivia</li>
                <li className="break-all">info@olimpiadaohsansi.edu.bo</li>
                <li>+591 4 123-4567</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-slate-600">
            <p>&copy; 2025 Olimpiada Oh! SanSi - Universidad Mayor de San Simón. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>

  )
}
