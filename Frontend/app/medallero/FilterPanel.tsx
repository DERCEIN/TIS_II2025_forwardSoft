"use client"

import type { Area, Level } from "@/lib/types"
import { areas, niveles } from "@/lib/data"

interface FilterPanelProps {
  searchName: string
  onSearchNameChangeAction: (value: string) => void
  selectedArea: Area | ""
  onAreaChangeAction: (value: Area | "") => void
  selectedLevel: Level | ""
  onLevelChangeAction: (value: Level | "") => void
}

export default function FilterPanel({
  searchName,
  onSearchNameChangeAction,
  selectedArea,
  onAreaChangeAction,
  selectedLevel,
  onLevelChangeAction,
}: FilterPanelProps) {
  return (
    <div className="bg-card rounded-lg p-6 shadow-md border border-border max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda por nombre */}
        <div>
          <label className="block text-sm font-semibold mb-2">Buscar Olimpista</label>
          <input
            type="text"
            placeholder="Nombre..."
            value={searchName}
            onChange={(e) => onSearchNameChangeAction(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filtro por área */}
        <div>
          <label className="block text-sm font-semibold mb-2">Área</label>
          <select
            value={selectedArea}
            onChange={(e) => onAreaChangeAction((e.target.value as Area) || "")}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por nivel */}
        <div>
          <label className="block text-sm font-semibold mb-2">Nivel</label>
          <select
            value={selectedLevel}
            onChange={(e) => onLevelChangeAction((e.target.value as Level) || "")}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los niveles</option>
            {niveles.map((nivel) => (
              <option key={nivel} value={nivel}>
                {nivel}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
