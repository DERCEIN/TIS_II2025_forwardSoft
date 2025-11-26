"use client";

import React from "react";

type Competitor = {
  id: number;
  nombre: string;
  unidad: string;
  area: string;
  nivel: string;
  puntaje: number;
  estado: string;
  puesto?: number | null;
};

type Area = {
  id: string;
  nombre: string;
  approved: boolean;
  competitors: Competitor[];
};

export default function AreaRow({
  area,
  isSelected,
  onSelect,
  onPreview,
  onToggleApproved,
}: {
  area: Area;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  onToggleApproved: (id: string, approved: boolean) => void;
}) {
  // count helpers
  const total = area.competitors.length;
  const countByState = (state: string) => area.competitors.filter((c) => c.estado === state).length;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded border ${
        area.approved ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <input
          type="radio"
          checked={isSelected}
          onChange={() => onSelect(area.id)}
          className="w-4 h-4"
          aria-label={`Seleccionar área ${area.nombre}`}
        />
        <div className="min-w-0">
          <div className="font-semibold truncate">{area.nombre}</div>
          <div className="text-xs text-gray-500">
            {total} total · Aprobados: {countByState("aprobado")} · Mención: {countByState("mencion")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPreview(area.id)}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
          title="Previsualizar lista de esta área"
        >
          Previsualizar
        </button>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={area.approved}
            onChange={(e) => onToggleApproved(area.id, e.target.checked)}
            title="Marcar lista aprobada por coordinador"
            className="w-4 h-4"
          />
          <span className="sr-only">Marcar como aprobada</span>
        </label>
      </div>
    </div>
  );
}