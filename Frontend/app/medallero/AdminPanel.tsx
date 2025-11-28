"use client"

import { useState } from "react"
import type { Area, Level } from "@/lib/types"
import { areas, niveles } from "@/lib/data"

export default function AdminPanel() {
  const [publishType, setPublishType] = useState<"todo" | "area" | "nivel" | "area-nivel">("todo")
  const [selectedArea, setSelectedArea] = useState<Area | "">("")
  const [selectedLevel, setSelectedLevel] = useState<Level | "">("")
  const [isPublished, setIsPublished] = useState(false)
  const [publishedAt, setPublishedAt] = useState<Date | null>(null)

  const handlePublish = () => {
    setPublishedAt(new Date())
    setIsPublished(true)
    setTimeout(() => setIsPublished(false), 3000)
  }

  const getPublishDescription = () => {
    switch (publishType) {
      case "todo":
        return "Publicar todos los resultados de todas las áreas y niveles"
      case "area":
        return `Publicar todos los resultados de ${selectedArea}`
      case "nivel":
        return `Publicar todos los resultados de ${selectedLevel}`
      case "area-nivel":
        return `Publicar resultados de ${selectedArea} - ${selectedLevel}`
      default:
        return ""
    }
  }

  const canPublish = () => {
    if (publishType === "area" && !selectedArea) return false
    if (publishType === "nivel" && !selectedLevel) return false
    if (publishType === "area-nivel" && (!selectedArea || !selectedLevel)) return false
    return true
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg shadow-lg border border-border p-8">
        <h2 className="text-2xl font-bold mb-6 text-primary">Panel de Administración</h2>

        {/* Tipo de publicación */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3">Tipo de Publicación</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="publishType"
                value="todo"
                checked={publishType === "todo"}
                onChange={(e) => setPublishType(e.target.value as any)}
                className="w-4 h-4"
              />
              <span>Publicar Todo</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="publishType"
                value="area"
                checked={publishType === "area"}
                onChange={(e) => setPublishType(e.target.value as any)}
                className="w-4 h-4"
              />
              <span>Por Área</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="publishType"
                value="nivel"
                checked={publishType === "nivel"}
                onChange={(e) => setPublishType(e.target.value as any)}
                className="w-4 h-4"
              />
              <span>Por Nivel</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="publishType"
                value="area-nivel"
                checked={publishType === "area-nivel"}
                onChange={(e) => setPublishType(e.target.value as any)}
                className="w-4 h-4"
              />
              <span>Por Área + Nivel</span>
            </label>
          </div>
        </div>

        {/* Selección de área */}
        {(publishType === "area" || publishType === "area-nivel") && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Seleccionar Área</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value as Area)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona una área</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selección de nivel */}
        {(publishType === "nivel" || publishType === "area-nivel") && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Seleccionar Nivel</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as Level)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona un nivel</option>
              {niveles.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Descripción */}
        <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
          <p className="text-sm font-semibold">Resumen de Publicación:</p>
          <p className="text-foreground mt-2">{getPublishDescription()}</p>
        </div>

        {/* Botón de publicación */}
        <button
          onClick={handlePublish}
          disabled={!canPublish()}
          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
            canPublish()
              ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
          }`}
        >
          {isPublished ? "Publicado ✓" : "Publicar Resultados"}
        </button>

        {publishedAt && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg border border-green-300">
            <p className="text-sm font-semibold">Publicado el {publishedAt.toLocaleString("es-ES")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
