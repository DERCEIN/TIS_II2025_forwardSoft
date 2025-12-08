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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda por nombre */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Buscar Olimpista</label>
            <input
              type="text"
              placeholder="Nombre..."
              value={searchName}
              onChange={(e) => onSearchNameChangeAction(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Filtro por área */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Área</label>
            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => onAreaChangeAction((e.target.value as Area) || "")}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium appearance-none cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                <option value="">Todas las áreas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro por nivel */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Nivel</label>
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => onLevelChangeAction((e.target.value as Level) || "")}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium appearance-none cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                <option value="">Todos los niveles</option>
                {niveles.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
